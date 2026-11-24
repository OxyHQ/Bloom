#!/usr/bin/env python3
"""Official artifact transport fallback; failed integrity checks never fall back."""
import argparse
import datetime
import email.utils
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import tarfile
import time
import zipfile

MANIFEST = json.loads(Path(__file__).with_suffix('.json').read_text())
KOTLIN_VERSIONS = ('2.2.0', '2.2.10', '2.2.21')


class DownloadFailure(RuntimeError):
    pass


# What a later attempt can cure: the host is busy or rate limiting (408, 425,
# 429, 5xx gateways) or the connection broke (resolve, connect, timeout, TLS
# handshake, empty reply, send/receive reset, HTTP/2 stream). A 404, 403 or an
# untrusted certificate is final for that host and goes to the fallback at once.
TRANSIENT_HTTP = frozenset({'408', '425', '429', '500', '502', '503', '504'})
TRANSIENT_CURL = frozenset({5, 6, 7, 16, 18, 28, 35, 52, 55, 56, 92})
ATTEMPTS = 6
BACKOFF_SECONDS = (2, 4, 8, 16, 32)
RETRY_AFTER_CAP_SECONDS = 120
RETRY_BUDGET_SECONDS = 420


def retry_after_seconds(value):
    """A Retry-After header (delta seconds or an HTTP date) in seconds, or None."""
    value = value.strip()
    if not value:
        return None
    if value.isdigit():
        return int(value)
    try:
        when = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if when.tzinfo is None:
        return None
    return max(0, int((when - datetime.datetime.now(datetime.timezone.utc)).total_seconds()))


def download(url, destination, sleep=time.sleep, clock=time.monotonic):
    # One curl attempt at a time; the retry policy is here, not in curl.
    # curl's own --retry backs off 1, 2, 4, 8 s (15 s in all), and Maven
    # Central and its Google mirror rate-limit a shared runner for longer:
    # both answered 429 for the whole 15 s (job 138071866469). Here a transient
    # failure waits 2, 4, 8, 16, 32 s, or the host's Retry-After when it asks
    # for longer (capped at 120 s), inside a 7 minute budget per URL.
    # Each attempt starts from no file, so a partial body never survives, and
    # success requires a non-empty file: curl exiting 0 with no body written
    # (always the SDK 31 runtime, jobs 138058057372, 138063112723 and
    # 138164981120) is a failed attempt, not a download.
    # Integrity is still checked by the caller, on every route.
    # No credentials, signed redirect URLs or response bodies enter the logs.
    deadline = clock() + RETRY_BUDGET_SECONDS
    for attempt in range(1, ATTEMPTS + 1):
        destination.unlink(missing_ok=True)
        result = subprocess.run([
            'curl', '--fail', '--location', '--silent', '--show-error',
            '--connect-timeout', '15', '--max-time', '90',
            '--proto', '=https', '--proto-redir', '=https',
            '--header', 'Accept: application/octet-stream',
            '--output', str(destination), '--write-out', '%{http_code}\n%header{retry-after}', url,
        ], capture_output=True, text=True)
        status, _, retry_after = result.stdout.partition('\n')
        status = status if status.isdigit() and len(status) == 3 else 'unknown'
        if result.returncode == 0 and destination.is_file() and destination.stat().st_size:
            return
        if result.returncode == 0:
            failure = f'curl 0 wrote no body, HTTP {status}'
            transient = True
        else:
            failure = f'curl {result.returncode}, HTTP {status}'
            transient = status in TRANSIENT_HTTP or result.returncode in TRANSIENT_CURL
        destination.unlink(missing_ok=True)
        if not transient or attempt == ATTEMPTS:
            break
        delay = BACKOFF_SECONDS[attempt - 1]
        asked = retry_after_seconds(retry_after) if status in ('429', '503') else None
        if asked is not None:
            delay = max(delay, min(asked, RETRY_AFTER_CAP_SECONDS))
        if clock() + delay > deadline:
            break
        print(f'{destination.name}: {failure}; attempt {attempt + 1} of {ATTEMPTS} in {delay} s', flush=True)
        sleep(delay)
    raise DownloadFailure(f'Official download transport failed ({failure})')


def primary_available(url):
    # A bounded GET exercises redirects that HEAD can miss. Some official
    # hosts ignore Range; curl then refuses the body after healthy headers.
    # Transient failures (a timeout, 429, 5xx) are retried with curl's
    # backoff before the canonical host is judged down: one dropped probe sent
    # a job to the fallback host, which then rate-limited it. Not
    # --retry-all-errors: the healthy refusal above (curl 63) must not retry.
    result = subprocess.run([
        'curl', '--fail', '--location', '--silent', '--show-error',
        '--connect-timeout', '10', '--max-time', '30',
        '--retry', '3', '--retry-max-time', '60',
        '--proto', '=https', '--proto-redir', '=https',
        '--range', '0-0', '--max-filesize', '1', '--output', os.devnull,
        '--write-out', '%{http_code}', url,
    ], capture_output=True, text=True)
    return result.returncode in (0, 63) and result.stdout in ('200', '206')


def after_failed_probe(transport, failed_url=None):
    def fallback_only(url, destination):
        if url == failed_url or (url.startswith(('https://services.gradle.org/', 'https://repo.maven.apache.org/')) and destination.suffix != '.pom'):
            raise DownloadFailure('Canonical transport failed its bounded preflight')
        transport(url, destination)
    return fallback_only


def verify(path, artifact):
    with path.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    if path.stat().st_size != artifact['size'] or digest != artifact['sha256']:
        raise ValueError(f'Integrity check failed for {artifact["filename"]}')


def fetch(artifact, directory, transport=download):
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / artifact['filename']
    # Always probe primary first. A previous temporary result must not silently
    # enable a fallback repository when the canonical transport has recovered.
    # Each fetch downloads into its own new directory beside the destination
    # (the same filesystem, so the verified file is renamed into place
    # atomically); nothing else writes there or removes it before the rename.
    with tempfile.TemporaryDirectory(dir=directory, prefix='.download-') as temporary:
        pending = Path(temporary) / artifact['filename']
        route = 'primary'
        try:
            transport(artifact['primary'], pending)
        except DownloadFailure:
            pending.unlink(missing_ok=True)
            route = 'official-fallback'
            transport(artifact['fallback'], pending)
        verify(pending, artifact)
        pending.replace(destination)
    print(f'{artifact["filename"]}: {route}, SHA256 verified', flush=True)
    return destination, route


def install_gradle(version, directory, transport=download):
    if version not in ('8.3', '9.4.1'):
        raise ValueError('Only the existing Android matrix Gradle versions are supported')
    archive, route = fetch(MANIFEST[f'gradle-{version}'], directory / 'downloads', transport)
    install = directory / f'gradle-{version}'
    if install.exists():
        raise ValueError('Refusing to reuse an unverified extracted Gradle installation')
    with zipfile.ZipFile(archive) as zipped:
        for member in zipped.namelist():
            parts = Path(member).parts
            if not parts or parts[0] != f'gradle-{version}' or '..' in parts or Path(member).is_absolute():
                raise ValueError('Unexpected Gradle archive path')
        zipped.extractall(directory)
    executable = install / 'bin' / 'gradle'
    executable.chmod(0o755)
    result = subprocess.run([str(executable), '--version'], capture_output=True, text=True, check=True,
                            env={**os.environ, 'GRADLE_USER_HOME': str(directory / 'version-check-home')})
    if f'Gradle {version}' not in result.stdout.splitlines():
        raise ValueError('Extracted Gradle version does not match the Android matrix')
    return executable.parent, route


def prepare_kotlin(directory, gradle_user_home, transport=download, probe=primary_available, version='2.2.0'):
    if version not in KOTLIN_VERSIONS:
        raise ValueError('Only the existing Kotlin compiler 2.2.0, 2.2.10 and 2.2.21 artifacts are supported')
    init = gradle_user_home / 'init.d' / f'bloom-verified-kotlin-{version}.init.gradle'
    if probe(MANIFEST[f'kotlin-compiler-embeddable-{version}']['primary']):
        init.unlink(missing_ok=True)
        print(f'Kotlin {version}: canonical transport available; normal Gradle resolution retained', flush=True)
        return 'primary-available'
    jar, route = fetch(MANIFEST[f'kotlin-compiler-embeddable-{version}'], directory / 'downloads', after_failed_probe(transport))
    pom, _ = fetch(MANIFEST[f'kotlin-pom-{version}'], directory / 'downloads', transport)
    repository = directory / 'maven'
    module = repository / f'org/jetbrains/kotlin/kotlin-compiler-embeddable/{version}'
    module.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(jar, module / jar.name)
    shutil.copyfile(pom, module / pom.name)
    # This init file runs in included builds too. Only a single exact GAV can
    # resolve locally; its original POM keeps every transitive dependency intact.
    uri = repository.resolve().as_uri()
    if "'" in uri:
        raise ValueError('Unexpected quote in temporary repository URI')
    init.parent.mkdir(parents=True, exist_ok=True)
    init.write_text(f'''// Generated only after a verified official transport fallback.
allprojects {{ project ->
    project.repositories.exclusiveContent {{
        forRepository {{
            project.repositories.maven {{
                name = 'BloomVerifiedKotlin{version.replace('.', '')}'
                url = uri('{uri}')
                metadataSources {{ mavenPom(); artifact() }}
            }}
        }}
        filter {{ includeVersion('org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '{version}') }}
    }}
}}
''')
    print('Enabled exact-GAV Kotlin fallback for root and included builds', flush=True)
    return route


def prepare_hermes(directory, react_native, transport=download, probe=primary_available):
    version = (react_native / 'sdks/.hermesv1version').read_text().strip()
    if version != 'hermes-v260318099.0.5':
        raise ValueError('Only the installed Hermes hermes-v260318099.0.5 source is verified')
    pin = MANIFEST[version]
    if probe(pin['primary']):
        print('Hermes: canonical transport available; normal RN download retained', flush=True)
        return None
    archive, _ = fetch(pin, directory / 'downloads', after_failed_probe(transport, pin['primary']))
    source = directory / 'source'
    if source.exists():
        raise ValueError('Refusing to reuse an unverified extracted Hermes source')
    # No symlinks/devices exist in this pinned source archive. Refuse any new
    # ones and verify every root/path before writing into the job-local folder.
    with tarfile.open(archive, 'r:gz') as tar:
        for member in tar.getmembers():
            parts = Path(member.name).parts
            if (not parts or parts[0] != pin['archive_root'] or '..' in parts
                    or Path(member.name).is_absolute() or not (member.isfile() or member.isdir())):
                raise ValueError('Unexpected Hermes archive member')
        tar.extractall(source, filter='data')
    tree = source / pin['archive_root']
    if not (tree / 'CMakeLists.txt').is_file():
        raise ValueError('Verified Hermes source is missing its build entry')
    print(f'Hermes: verified source commit {pin["commit"]}; RN compilation tasks retained', flush=True)
    return tree


ROBOLECTRIC_RUNTIMES = ('11-robolectric-6757853-i7', '12-robolectric-7732740-i7', '14-robolectric-10818077-i7')


def prepare_robolectric(repository, transport=download):
    """
    The android-all-instrumented runtimes Robolectric 4.15.1 runs the unit
    tests on (SDK 30, 31 and 34), verified and placed in the local Maven
    repository it reads. Robolectric fetches a missing one itself, once, with no
    retry (`MavenArtifactFetcher`); a jar already in `~/.m2/repository` is used
    as it is. Fetched here with the retrying transport and the integrity pins,
    and kept in the Actions cache by validate.yml, the tests reach no network.
    """
    for version in ROBOLECTRIC_RUNTIMES:
        module = repository / f'org/robolectric/android-all-instrumented/{version}'
        for extension in ('pom', 'jar'):
            pin = MANIFEST[f'android-all-instrumented-{version}-{extension}']
            target = module / pin['filename']
            try:
                verify(target, pin)
                continue
            except (FileNotFoundError, ValueError):
                target.unlink(missing_ok=True)
            fetch(pin, module, transport)
            # What Robolectric writes beside what it fetches, from the verified bytes.
            with target.open('rb') as source:
                digest = hashlib.file_digest(source, 'sha512').hexdigest()
            target.with_name(target.name + '.sha512').write_text(digest)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('kind', choices=['gradle', 'kotlin', 'hermes', 'robolectric', 'robolectric-key', 'cleanup', 'cleanup-hermes'])
    parser.add_argument('--version')
    parser.add_argument('--react-native', type=Path)
    parser.add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    if args.kind == 'robolectric':
        prepare_robolectric(args.directory)
        return
    if args.kind == 'robolectric-key':
        # The Actions cache key of the runtimes: their versions.
        print('robolectric-' + '_'.join(ROBOLECTRIC_RUNTIMES))
        return
    if args.kind == 'cleanup-hermes':
        source = args.directory / 'source'
        if source.exists():
            shutil.rmtree(source)
        return
    if args.kind == 'hermes':
        if args.react_native is None:
            parser.error('--react-native is required for Hermes')
        source = prepare_hermes(args.directory, args.react_native)
        if source is not None:
            with open(os.environ['GITHUB_ENV'], 'a') as output:
                output.write(f'REACT_NATIVE_OVERRIDE_HERMES_DIR={source.resolve()}\n')
        return
    if args.kind == 'cleanup':
        home = os.environ.get('GRADLE_USER_HOME')
        if home:
            for filename in ['bloom-verified-kotlin.init.gradle'] + [f'bloom-verified-kotlin-{version}.init.gradle' for version in KOTLIN_VERSIONS]:
                (Path(home) / 'init.d' / filename).unlink(missing_ok=True)
        return
    if args.kind == 'gradle':
        if args.version not in ('8.3', '9.4.1'):
            raise ValueError('Only the existing Android matrix Gradle versions are supported')
        if primary_available(MANIFEST[f'gradle-{args.version}']['primary']):
            print(f'Gradle {args.version}: canonical transport available; setup-gradle cache/install retained', flush=True)
            return
        binary, _ = install_gradle(args.version, args.directory, after_failed_probe(download))
        with open(os.environ['GITHUB_PATH'], 'a') as output:
            output.write(str(binary) + '\n')
    else:
        if args.version not in KOTLIN_VERSIONS:
            raise ValueError('Only the existing Kotlin compiler 2.2.0, 2.2.10 and 2.2.21 artifacts are supported')
        prepare_kotlin(args.directory, Path(os.environ['GRADLE_USER_HOME']), version=args.version)


if __name__ == '__main__':
    main()
