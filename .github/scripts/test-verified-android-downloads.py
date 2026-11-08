#!/usr/bin/env python3
import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import tarfile
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
        result = subprocess.CompletedProcess([],22,stdout='504',stderr='signed-url-or-token')
        with patch.object(module.subprocess, 'run', return_value=result) as run:
            with self.assertRaisesRegex(module.DownloadFailure, r'curl 22, HTTP 504') as failure:
                module.download('https://official.invalid', self.root / 'artifact')
            self.assertNotIn('signed-url', str(failure.exception))
            self.assertIn('--retry', run.call_args.args[0])
            self.assertIn('--retry-all-errors', run.call_args.args[0])
            args = run.call_args.args[0]
            for flag, expected in [('--retry', '2'), ('--retry-max-time', '180'), ('--max-time', '90')]:
                self.assertEqual(args[args.index(flag) + 1], expected)
            self.assertNotIn('--insecure', args)
            self.assertNotIn('-k', args)

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
        # The pre-change curl policy demonstrably stops with curl 56.
        failed = subprocess.run(['curl', '--fail', '--silent', '--output', str(output), self.url], capture_output=True)
        self.assertEqual(failed.returncode, 56)
        self.assertEqual(self.requests, 1)
        self.assertGreater(output.stat().st_size, 0)
        self.requests = 0
        module.download(self.url, output)
        self.assertEqual(self.requests, 2)
        self.assertEqual(output.read_bytes(), self.payload)
        module.verify(output, artifact(self.payload))

    def test_receive_reset_exhausts_exactly_three_attempts(self):
        import time
        self.mode = 'reset'
        start = time.monotonic()
        with self.assertRaisesRegex(module.DownloadFailure, 'curl 56'):
            module.download(self.url, self.root / 'artifact')
        self.assertEqual(self.requests, 3)
        self.assertLess(time.monotonic() - start, 30)

    def test_404_still_fails_after_bounded_retries(self):
        self.mode = 'missing'
        with self.assertRaisesRegex(module.DownloadFailure, 'curl 22, HTTP 404'):
            module.download(self.url, self.root / 'artifact')
        self.assertEqual(self.requests, 3)

    def test_untrusted_tls_still_fails_without_an_http_request(self):
        with patch.dict(module.os.environ, {'CURL_CA_BUNDLE': '/etc/ssl/certs/ca-certificates.crt'}):
            with self.assertRaisesRegex(module.DownloadFailure, 'curl 60'):
                module.download(self.url, self.root / 'artifact')
        self.assertEqual(self.requests, 0)


if __name__ == '__main__':
    unittest.main()
