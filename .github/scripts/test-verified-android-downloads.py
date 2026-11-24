#!/usr/bin/env python3
import datetime
import email.utils
import hashlib
import importlib.util
import io
from pathlib import Path
import re
import tempfile
import tarfile
import time
import sys
sys.dont_write_bytecode = True
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('downloads', Path(__file__).with_name('verified-android-downloads.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def artifact(body, filename='artifact.jar'):
    return {'filename': filename, 'primary': 'https://primary.invalid/artifact',
            'fallback': 'https://fallback.invalid/artifact', 'size': len(body),
            'sha256': hashlib.sha256(body).hexdigest()}


class VerifiedDownloads(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_primary_success_never_calls_fallback(self):
        calls = []
        def transport(url, output):
            calls.append(url)
            output.write_bytes(b'official')
        path, route = module.fetch(artifact(b'official'), self.root, transport)
        self.assertEqual(path.read_bytes(), b'official')
        self.assertEqual(route, 'primary')
        self.assertEqual(calls, ['https://primary.invalid/artifact'])

    def test_transport_failure_uses_only_verified_fallback(self):
        calls = []
        def transport(url, output):
            calls.append(url)
            if 'primary' in url:
                output.write_bytes(b'partial')
                raise module.DownloadFailure('HTTP 504')
            self.assertFalse(output.exists())
            output.write_bytes(b'official')
        path, route = module.fetch(artifact(b'official'), self.root, transport)
        self.assertEqual(path.read_bytes(), b'official')
        self.assertEqual(route, 'official-fallback')
        self.assertEqual(len(calls), 2)

    def test_corrupt_primary_does_not_fall_back_or_publish(self):
        calls = []
        def transport(url, output):
            calls.append(url)
            output.write_bytes(b'corrupt!')
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.fetch(artifact(b'official'), self.root, transport)
        self.assertEqual(len(calls), 1)
        self.assertFalse((self.root / 'artifact.jar').exists())

    def test_wrong_size_with_matching_digest_never_retries_or_falls_back(self):
        calls = []
        pin = artifact(b'official')
        pin['size'] += 1
        def transport(url, output):
            calls.append(url)
            output.write_bytes(b'official')
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.fetch(pin, self.root, transport)
        self.assertEqual(calls, [pin['primary']])
        self.assertFalse((self.root / 'artifact.jar').exists())

    def test_corrupt_fallback_is_rejected(self):
        def transport(url, output):
            if 'primary' in url:
                raise module.DownloadFailure('HTTP 504')
            output.write_bytes(b'corrupt!')
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.fetch(artifact(b'official'), self.root, transport)
        self.assertFalse((self.root / 'artifact.jar').exists())

    def test_transport_error_reports_status_without_sensitive_response(self):
        import subprocess
        result = subprocess.CompletedProcess([],22,stdout='504\n',stderr='signed-url-or-token')
        delays = []
        with patch.object(module.subprocess, 'run', return_value=result) as run:
            with self.assertRaisesRegex(module.DownloadFailure, r'curl 22, HTTP 504') as failure:
                module.download('https://official.invalid', self.root / 'artifact', sleep=delays.append)
            self.assertNotIn('signed-url', str(failure.exception))
            args = run.call_args.args[0]
            self.assertEqual(args[args.index('--max-time') + 1], '90')
            # One attempt per curl run: the backoff below is the only retry policy.
            self.assertNotIn('--retry', args)
            self.assertNotIn('--retry-all-errors', args)
            self.assertNotIn('--insecure', args)
            self.assertNotIn('-k', args)
        self.assertEqual(run.call_count, module.ATTEMPTS)
        self.assertEqual(delays, [2, 4, 8, 16, 32])

    def scripted(self, steps):
        """subprocess.run stand-in: each step is (curl exit, stdout, body or None)."""
        import subprocess
        calls = []
        def run(args, **_kwargs):
            code, stdout, body = steps[len(calls)]
            calls.append(args)
            if body is not None:
                Path(args[args.index('--output') + 1]).write_bytes(body)
            return subprocess.CompletedProcess(args, code, stdout=stdout, stderr='')
        return run, calls

    def test_exit_zero_without_a_file_is_retried_not_trusted(self):
        # Jobs 138058057372 and 138063112723: curl exited 0 and the file it was
        # told to write did not exist, so verify() raised FileNotFoundError.
        run, calls = self.scripted([(0, '200\n', None), (0, '200\n', b'official')])
        delays = []
        output = self.root / 'artifact.jar'
        with patch.object(module.subprocess, 'run', side_effect=run):
            module.download('https://official.invalid', output, sleep=delays.append)
        self.assertEqual(len(calls), 2)
        self.assertEqual(delays, [2])
        self.assertEqual(output.read_bytes(), b'official')

    def test_exit_zero_with_an_empty_body_is_retried_not_an_integrity_failure(self):
        run, calls = self.scripted([(0, '200\n', b''), (0, '200\n', b'official')])
        with patch.object(module.subprocess, 'run', side_effect=run):
            path, route = module.fetch(artifact(b'official'), self.root,
                                       lambda url, output: module.download(url, output, sleep=lambda _: None))
        self.assertEqual((len(calls), route, path.read_bytes()), (2, 'primary', b'official'))

    def test_exit_zero_without_a_file_every_time_is_a_transport_failure(self):
        run, calls = self.scripted([(0, '200\n', None)] * module.ATTEMPTS)
        with patch.object(module.subprocess, 'run', side_effect=run):
            with self.assertRaisesRegex(module.DownloadFailure, 'curl 0 wrote no body, HTTP 200'):
                module.download('https://official.invalid', self.root / 'artifact', sleep=lambda _: None)
        self.assertEqual(len(calls), module.ATTEMPTS)

    def test_rate_limit_honours_retry_after_within_its_cap(self):
        later = email.utils.format_datetime(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=50), usegmt=True)
        run, calls = self.scripted([(22, '429\n7', None), (22, '429\n1', None), (22, '503\n' + later, None),
                                    (22, '429\n86400', None), (0, '200\n', b'official')])
        delays = []
        with patch.object(module.subprocess, 'run', side_effect=run):
            module.download('https://official.invalid', self.root / 'artifact', sleep=delays.append)
        self.assertEqual(len(calls), 5)
        # Longer of the backoff and Retry-After (seconds or a date), at most 120 s.
        self.assertEqual(delays[:2], [7, 4])
        self.assertTrue(45 <= delays[2] <= 50, delays)
        self.assertEqual(delays[3], module.RETRY_AFTER_CAP_SECONDS)

    def test_github_rate_limit_403_is_retried_until_its_reset(self):
        reset = str(int(time.time()) + 30)
        run, calls = self.scripted([(22, f'403\n\n0\n{reset}', None), (22, '403\n5\n\n', None),
                                    (0, '200\n', b'official')])
        delays = []
        with patch.object(module.subprocess, 'run', side_effect=run):
            module.download('https://official.invalid', self.root / 'artifact', sleep=delays.append)
        self.assertEqual(len(calls), 3)
        self.assertTrue(28 <= delays[0] <= 30, delays)
        self.assertEqual(delays[1], 5)

    def test_retries_stop_at_the_time_budget(self):
        now = [0.0]
        def sleep(seconds):
            now[0] += seconds
        run, calls = self.scripted([(22, '429\n120', None)] * module.ATTEMPTS)
        with patch.object(module.subprocess, 'run', side_effect=run):
            with self.assertRaisesRegex(module.DownloadFailure, 'HTTP 429'):
                module.download('https://official.invalid', self.root / 'artifact', sleep=sleep, clock=lambda: now[0])
        # 120 + 120 + 120 s fit the 420 s budget; a fourth wait would not.
        self.assertEqual(len(calls), 4)
        self.assertLessEqual(now[0], module.RETRY_BUDGET_SECONDS)

    def test_permanent_failures_are_not_retried(self):
        for code, stdout in [(22, '404\n'), (22, '403\n'), (60, '000\n')]:
            with self.subTest(code=code, stdout=stdout):
                run, calls = self.scripted([(code, stdout, None)])
                with patch.object(module.subprocess, 'run', side_effect=run):
                    with self.assertRaises(module.DownloadFailure):
                        module.download('https://official.invalid', self.root / 'artifact', sleep=self.fail)
                self.assertEqual(len(calls), 1)

    def test_missing_primary_then_corrupt_fallback_is_rejected(self):
        run, calls = self.scripted([(22, '404\n', None), (0, '200\n', b'corrupt!')])
        with patch.object(module.subprocess, 'run', side_effect=run):
            with self.assertRaisesRegex(ValueError, 'Integrity'):
                module.fetch(artifact(b'official'), self.root)
        self.assertEqual(len(calls), 2)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_robolectric_cache_is_saved_under_the_path_it_is_restored_from(self):
        # actions/cache versions an entry by the path text: `$HOME/.m2` and
        # `~/.m2` are different entries, and the restore never found the save.
        workflow = (Path(__file__).parents[1] / 'workflows' / 'validate.yml').read_text()
        restored = re.findall(r'path: (\S*android-all-instrumented)$', workflow, re.M)
        saved = re.findall(r"paths=(\S*android-all-instrumented)'?$", workflow, re.M)
        self.assertTrue(restored and saved)
        self.assertEqual(set(restored) | set(saved), {'~/.m2/repository/org/robolectric/android-all-instrumented'})

    def test_probe_retries_transient_failures_but_not_its_healthy_refusal(self):
        import subprocess
        with patch.object(module.subprocess, 'run', return_value=subprocess.CompletedProcess([], 63, stdout='200', stderr='')) as run:
            module.primary_available('https://official.invalid')
        args = run.call_args.args[0]
        self.assertEqual(args[args.index('--retry') + 1], '3')
        self.assertNotIn('--retry-all-errors', args)
        self.assertNotIn('--retry-delay', args)

    def test_robolectric_runtimes_are_verified_into_the_local_repository(self):
        bodies = {}
        pins = {}
        for version in module.ROBOLECTRIC_RUNTIMES:
            for extension in ('pom', 'jar'):
                body = f'{version}.{extension}'.encode()
                name = f'android-all-instrumented-{version}.{extension}'
                pin = artifact(body, name)
                pin['primary'] = f'https://primary.invalid/{name}'
                pins[f'android-all-instrumented-{version}-{extension}'] = pin
                bodies[pin['primary']] = body
        calls = []
        def transport(url, output):
            calls.append(url)
            output.write_bytes(bodies[url])
        with patch.dict(module.MANIFEST, pins):
            module.prepare_robolectric(self.root, transport)
            self.assertEqual(len(calls), 6)
            for version in module.ROBOLECTRIC_RUNTIMES:
                module_dir = self.root / f'org/robolectric/android-all-instrumented/{version}'
                jar = module_dir / f'android-all-instrumented-{version}.jar'
                self.assertEqual(jar.read_bytes(), f'{version}.jar'.encode())
                self.assertEqual((module_dir / (jar.name + '.sha512')).read_text(),
                                 hashlib.sha512(jar.read_bytes()).hexdigest())
                self.assertEqual(sorted(p.name for p in module_dir.iterdir()),
                                 sorted([jar.name, jar.name + '.sha512', jar.name[:-3] + 'pom', jar.name[:-3] + 'pom.sha512']))
            # A verified repository (the Actions cache) is used as it is.
            calls.clear()
            module.prepare_robolectric(self.root, transport)
            self.assertEqual(calls, [])
            # A corrupt jar is fetched again, not trusted.
            first = module.ROBOLECTRIC_RUNTIMES[0]
            corrupt = self.root / f'org/robolectric/android-all-instrumented/{first}/android-all-instrumented-{first}.jar'
            corrupt.write_bytes(b'truncated')
            module.prepare_robolectric(self.root, transport)
            self.assertEqual(calls, [f'https://primary.invalid/android-all-instrumented-{first}.jar'])
            self.assertEqual(corrupt.read_bytes(), f'{first}.jar'.encode())

    def test_robolectric_pins_are_the_maven_central_runtimes(self):
        for version in module.ROBOLECTRIC_RUNTIMES:
            for extension in ('pom', 'jar'):
                pin = module.MANIFEST[f'android-all-instrumented-{version}-{extension}']
                path = f'org/robolectric/android-all-instrumented/{version}/android-all-instrumented-{version}.{extension}'
                self.assertEqual(pin['primary'], f'https://repo.maven.apache.org/maven2/{path}')
                self.assertEqual(pin['fallback'], f'https://maven-central.storage-download.googleapis.com/maven2/{path}')

    def test_probe_treats_only_success_or_bounded_healthy_body_as_available(self):
        import subprocess
        for code, status, available in [(0,'206',True),(63,'200',True),(22,'504',False),(28,'000',False),(0,'404',False),(63,'302',False),(63,'504',False)]:
            with self.subTest(code=code,status=status), patch.object(module.subprocess,'run',return_value=subprocess.CompletedProcess([],code,stdout=status,stderr='')):
                self.assertEqual(module.primary_available('https://official.invalid'), available)

    def test_healthy_gradle_keeps_action_cache_and_does_not_download(self):
        argv=['helper','gradle','--version','9.4.1','--directory',str(self.root)]
        with patch.object(sys,'argv',argv), patch.object(module,'primary_available',return_value=True), patch.object(module,'install_gradle') as install:
            module.main()
            install.assert_not_called()

    def test_wrong_kotlin_version_is_rejected_before_download(self):
        argv=['helper','kotlin','--version','2.3.0','--directory',str(self.root)]
        with patch.object(sys,'argv',argv), patch.object(module,'prepare_kotlin') as prepare:
            with self.assertRaisesRegex(ValueError,'existing Kotlin compiler'):
                module.main()
            prepare.assert_not_called()

    def test_cleanup_removes_only_own_init_and_handles_unset_home(self):
        home = self.root / 'home'
        init = home / 'init.d/bloom-verified-kotlin-2.2.0.init.gradle'
        init.parent.mkdir(parents=True)
        init.write_text('owned')
        other = init.with_name('other.init.gradle')
        other.write_text('unrelated')
        argv=['helper','cleanup','--directory',str(self.root)]
        with patch.object(sys,'argv',argv), patch.dict(module.os.environ,{'GRADLE_USER_HOME':str(home)}):
            module.main()
        self.assertFalse(init.exists())
        self.assertEqual(other.read_text(),'unrelated')
        with patch.object(sys,'argv',argv), patch.dict(module.os.environ,{},clear=True):
            module.main()

    def test_unknown_gradle_version_cannot_download(self):
        with self.assertRaisesRegex(ValueError, 'existing Android matrix'):
            module.install_gradle('9.5', self.root, lambda *_: self.fail('downloaded'))

    def test_archive_version_must_match(self):
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w') as zipped:
            zipped.writestr('gradle-8.3/bin/gradle', '#!/bin/sh\necho "Gradle 9.4.1"\n')
        data = archive.getvalue()
        with patch.dict(module.MANIFEST, {'gradle-8.3': artifact(data, 'gradle-8.3-bin.zip')}):
            with self.assertRaisesRegex(ValueError, 'version does not match'):
                module.install_gradle('8.3', self.root, lambda _, output: output.write_bytes(data))

    def test_hermes_normal_route_and_unrecognized_version_do_not_override(self):
        rn = self.root / 'rn'
        (rn / 'sdks').mkdir(parents=True)
        version = rn / 'sdks/.hermesv1version'
        version.write_text('hermes-v260318099.0.5')
        self.assertIsNone(module.prepare_hermes(self.root / 'output', rn, lambda *_: self.fail('downloaded'), probe=lambda _: True))
        version.write_text('different-tag')
        with self.assertRaisesRegex(ValueError, 'Only the installed Hermes'):
            module.prepare_hermes(self.root / 'output', rn, lambda *_: self.fail('downloaded'), probe=lambda _: False)

    def test_hermes_verified_tree_and_cleanup_leave_other_files(self):
        rn = self.root / 'rn'
        (rn / 'sdks').mkdir(parents=True)
        (rn / 'sdks/.hermesv1version').write_text('hermes-v260318099.0.5')
        archive = io.BytesIO()
        with tarfile.open(fileobj=archive, mode='w:gz') as tar:
            member = tarfile.TarInfo('meta-hermes-9a115f1/CMakeLists.txt')
            member.size = 5
            tar.addfile(member, io.BytesIO(b'build'))
        data = archive.getvalue()
        pin = {**module.MANIFEST['hermes-v260318099.0.5'], **artifact(data, 'hermes.tar.gz')}
        def fallback(url, output):
            self.assertNotIn('primary', url)
            output.write_bytes(data)
        directory = self.root / 'output'
        with patch.dict(module.MANIFEST, {'hermes-v260318099.0.5': pin}):
            tree = module.prepare_hermes(directory, rn, fallback, probe=lambda _: False)
        self.assertEqual((tree / 'CMakeLists.txt').read_text(), 'build')
        (directory / 'unrelated').write_text('keep')
        with patch.object(sys, 'argv', ['helper', 'cleanup-hermes', '--directory', str(directory)]):
            module.main()
        self.assertFalse(tree.exists())
        self.assertEqual((directory / 'unrelated').read_text(), 'keep')

    def test_hermes_archive_escape_rejected_before_extraction(self):
        rn = self.root / 'rn'
        (rn / 'sdks').mkdir(parents=True)
        (rn / 'sdks/.hermesv1version').write_text('hermes-v260318099.0.5')
        for name, kind in [('meta-hermes-9a115f1/../../escape', tarfile.REGTYPE), ('meta-hermes-9a115f1/link', tarfile.SYMTYPE), ('different-root/CMakeLists.txt', tarfile.REGTYPE)]:
            with self.subTest(name=name):
                archive = io.BytesIO()
                with tarfile.open(fileobj=archive, mode='w:gz') as tar:
                    member = tarfile.TarInfo(name)
                    member.type = kind
                    member.linkname = '/outside'
                    tar.addfile(member)
                data = archive.getvalue()
                pin = {**module.MANIFEST['hermes-v260318099.0.5'], **artifact(data, 'hermes.tar.gz')}
                with patch.dict(module.MANIFEST, {'hermes-v260318099.0.5': pin}):
                    with self.assertRaisesRegex(ValueError, 'Unexpected Hermes archive'):
                        module.prepare_hermes(self.root / 'output', rn, lambda _, out: out.write_bytes(data), probe=lambda _: False)
                self.assertFalse((self.root / 'output/source').exists())


    def test_all_observed_kotlin_versions_are_exclusive_and_cleanup_independent(self):
        home = self.root / 'home'
        pins = {}
        for version in ('2.2.0', '2.2.10', '2.2.21'):
            for suffix, key in [('jar', 'kotlin-compiler-embeddable'), ('pom', 'kotlin-pom')]:
                pins[f'{key}-{version}'] = artifact(f'{version}-{suffix}'.encode(), f'kotlin-compiler-embeddable-{version}.{suffix}')
        def transport(url, output):
            if 'primary' in url:
                raise module.DownloadFailure('HTTP 504')
            version = output.name.removeprefix('kotlin-compiler-embeddable-').rsplit('.', 1)[0]
            output.write_bytes(f'{version}-{output.suffix[1:]}'.encode())
        with patch.dict(module.MANIFEST, pins):
            for version in ('2.2.0', '2.2.10', '2.2.21'):
                module.prepare_kotlin(self.root / 'repo', home, transport, probe=lambda _: False, version=version)
                init = home / f'init.d/bloom-verified-kotlin-{version}.init.gradle'
                self.assertIn(f"includeVersion('org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '{version}')", init.read_text())
            module.prepare_kotlin(self.root / 'repo', home, transport, probe=lambda _: True, version='2.2.0')
            self.assertFalse((home / 'init.d/bloom-verified-kotlin-2.2.0.init.gradle').exists())
            self.assertTrue((home / 'init.d/bloom-verified-kotlin-2.2.10.init.gradle').exists())
        with patch.object(sys,'argv',['helper','cleanup','--directory',str(self.root)]), patch.dict(module.os.environ,{'GRADLE_USER_HOME':str(home)}):
            module.main()
        self.assertFalse((home / 'init.d/bloom-verified-kotlin-2.2.10.init.gradle').exists())
        self.assertFalse((home / 'init.d/bloom-verified-kotlin-2.2.21.init.gradle').exists())

    def test_exact_kotlin_repository_only_after_fallback_and_cleared_on_recovery(self):
        jar, pom = b'jar', b'original-pom-with-dependencies'
        pins = {'kotlin-compiler-embeddable-2.2.0': artifact(jar, 'kotlin-compiler-embeddable-2.2.0.jar'),
                'kotlin-pom-2.2.0': artifact(pom, 'kotlin-compiler-embeddable-2.2.0.pom')}
        home = self.root / 'gradle-home'
        def fallback(url, output):
            if 'primary' in url:
                raise module.DownloadFailure('HTTP 504')
            output.write_bytes(pom if output.suffix == '.pom' else jar)
        with patch.dict(module.MANIFEST, pins):
            module.prepare_kotlin(self.root / 'artifacts', home, fallback, probe=lambda _: False)
            init = home / 'init.d/bloom-verified-kotlin-2.2.0.init.gradle'
            text = init.read_text()
            self.assertIn("includeVersion('org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '2.2.0')", text)
            self.assertNotIn('includeGroup', text)
            copied = self.root / 'artifacts/maven/org/jetbrains/kotlin/kotlin-compiler-embeddable/2.2.0'
            self.assertEqual((copied / pins['kotlin-pom-2.2.0']['filename']).read_bytes(), pom)
            module.prepare_kotlin(self.root / 'artifacts', home, lambda *_: self.fail('healthy transport downloaded'), probe=lambda _: True)
            self.assertFalse(init.exists())


class RealCurlTransport(unittest.TestCase):
    """Exercise curl itself against a local HTTPS server, not a mocked retry loop."""
    def setUp(self):
        import http.server
        import socket
        import ssl
        import struct
        import subprocess
        import threading
        import time
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.cert = self.root / 'cert.pem'
        key = self.root / 'key.pem'
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                        '-days', '1', '-subj', '/CN=localhost', '-addext',
                        'subjectAltName=DNS:localhost', '-keyout', str(key), '-out', str(self.cert)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.requests = 0
        self.mode = 'recover'
        self.payload = b'verified complete artifact'
        test = self
        class Handler(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass
            def do_GET(self):
                test.requests += 1
                if test.mode == 'missing':
                    self.send_error(404)
                    return
                if test.mode == 'rate-limited' and test.requests < 3:
                    self.send_response(429)
                    self.send_header('Retry-After', '3')
                    self.send_header('Content-Length', '0')
                    self.end_headers()
                    return
                if test.mode == 'reset' or (test.mode == 'recover' and test.requests == 1):
                    self.send_response(200)
                    self.send_header('Content-Length', '10000')
                    self.end_headers()
                    self.wfile.write(b'partial-body-' * 20)
                    self.wfile.flush()
                    time.sleep(0.05)  # Deliver a partial body before the deliberate TCP reset.
                    self.connection.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
                    self.connection.close()
                    return
                self.send_response(200)
                self.send_header('Content-Length', str(len(test.payload)))
                self.end_headers()
                self.wfile.write(test.payload)
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(self.cert, key)
        server.socket = context.wrap_socket(server.socket, server_side=True)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        self.url = f'https://localhost:{server.server_port}/artifact'
        self.trust = patch.dict(module.os.environ, {'CURL_CA_BUNDLE': str(self.cert), 'NO_PROXY': 'localhost'})
        self.trust.start()
        self.addCleanup(self.trust.stop)

    def test_receive_reset_recovers_and_truncates_partial_output(self):
        import subprocess
        output = self.root / 'artifact'
        # A single curl run demonstrably stops with curl 56 and a partial file.
        failed = subprocess.run(['curl', '--fail', '--silent', '--output', str(output), self.url], capture_output=True)
        self.assertEqual(failed.returncode, 56)
        self.assertEqual(self.requests, 1)
        self.assertGreater(output.stat().st_size, 0)
        self.requests = 0
        delays = []
        module.download(self.url, output, sleep=delays.append)
        self.assertEqual(self.requests, 2)
        self.assertEqual(delays, [2])
        self.assertEqual(output.read_bytes(), self.payload)
        module.verify(output, artifact(self.payload))

    def test_receive_reset_exhausts_the_bounded_attempts(self):
        self.mode = 'reset'
        delays = []
        output = self.root / 'artifact'
        with self.assertRaisesRegex(module.DownloadFailure, 'curl 56'):
            module.download(self.url, output, sleep=delays.append)
        self.assertEqual(self.requests, module.ATTEMPTS)
        self.assertEqual(delays, [2, 4, 8, 16, 32])
        self.assertFalse(output.exists())

    def test_404_fails_at_once_for_the_fallback(self):
        self.mode = 'missing'
        with self.assertRaisesRegex(module.DownloadFailure, 'curl 22, HTTP 404'):
            module.download(self.url, self.root / 'artifact', sleep=self.fail)
        self.assertEqual(self.requests, 1)

    def test_rate_limit_waits_out_retry_after_and_recovers(self):
        self.mode = 'rate-limited'
        delays = []
        module.download(self.url, self.root / 'artifact', sleep=delays.append)
        self.assertEqual(self.requests, 3)
        self.assertEqual((self.root / 'artifact').read_bytes(), self.payload)
        # Two 429s with `Retry-After: 3`, read from the real response headers:
        # the longer of it and the 2 s, 4 s backoff.
        self.assertEqual(delays, [3, 4])

    def test_untrusted_tls_still_fails_without_an_http_request(self):
        with patch.dict(module.os.environ, {'CURL_CA_BUNDLE': '/etc/ssl/certs/ca-certificates.crt'}):
            with self.assertRaisesRegex(module.DownloadFailure, 'curl 60'):
                module.download(self.url, self.root / 'artifact', sleep=self.fail)
        self.assertEqual(self.requests, 0)


if __name__ == '__main__':
    unittest.main()
