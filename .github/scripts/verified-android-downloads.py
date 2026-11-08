#!/usr/bin/env python3
"""Official artifact transport fallback; failed integrity checks never fall back."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

MANIFEST = json.loads(Path(__file__).with_suffix('.json').read_text())


class DownloadFailure(RuntimeError):
    pass


def download(url, destination):
    # No credentials, signed redirect URLs or response bodies enter the logs.
    result = subprocess.run([
        'curl', '--fail', '--location', '--silent', '--show-error',
        '--connect-timeout', '15', '--max-time', '90',
        '--proto', '=https', '--proto-redir', '=https',
        '--header', 'Accept: application/octet-stream',
        '--output', str(destination), url,
    ], capture_output=True)
    if result.returncode:
        raise DownloadFailure(f'Official download transport failed (curl {result.returncode})')


def primary_available(url):
    # A bounded GET exercises redirects that HEAD can miss. Some official
    # hosts ignore Range; curl then refuses the body after healthy headers.
    result = subprocess.run([
        'curl', '--fail', '--location', '--silent', '--show-error',
        '--connect-timeout', '10', '--max-time', '30',
        '--proto', '=https', '--proto-redir', '=https',
        '--range', '0-0', '--max-filesize', '1', '--output', os.devnull,
        '--write-out', '%{http_code}', url,
    ], capture_output=True, text=True)
    return result.returncode in (0, 63) and result.stdout in ('200', '206')


def after_failed_probe(transport):
    def fallback_only(url, destination):
        if url.startswith(('https://services.gradle.org/', 'https://repo.maven.apache.org/')) and destination.suffix != '.pom':
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
    with tempfile.TemporaryDirectory(dir=directory) as temporary:
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


def prepare_kotlin(directory, gradle_user_home, transport=download, probe=primary_available):
    init = gradle_user_home / 'init.d' / 'bloom-verified-kotlin.init.gradle'
    if probe(MANIFEST['kotlin-compiler-embeddable-2.2.0']['primary']):
        init.unlink(missing_ok=True)
        print('Kotlin 2.2.0: canonical transport available; normal Gradle resolution retained', flush=True)
        return 'primary-available'
    jar, route = fetch(MANIFEST['kotlin-compiler-embeddable-2.2.0'], directory / 'downloads', after_failed_probe(transport))
    pom, _ = fetch(MANIFEST['kotlin-pom-2.2.0'], directory / 'downloads', transport)
    repository = directory / 'maven'
    module = repository / 'org/jetbrains/kotlin/kotlin-compiler-embeddable/2.2.0'
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
                name = 'BloomVerifiedKotlin220'
                url = uri('{uri}')
                metadataSources {{ mavenPom(); artifact() }}
            }}
        }}
        filter {{ includeVersion('org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '2.2.0') }}
    }}
}}
''')
    print('Enabled exact-GAV Kotlin fallback for root and included builds', flush=True)
    return route


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('kind', choices=['gradle', 'kotlin', 'cleanup'])
    parser.add_argument('--version')
    parser.add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    if args.kind == 'cleanup':
        home = os.environ.get('GRADLE_USER_HOME')
        if home:
            (Path(home) / 'init.d/bloom-verified-kotlin.init.gradle').unlink(missing_ok=True)
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
        if args.version != '2.2.0':
            raise ValueError('Only the existing Kotlin compiler 2.2.0 artifact is supported')
        prepare_kotlin(args.directory, Path(os.environ['GRADLE_USER_HOME']))


if __name__ == '__main__':
    main()
