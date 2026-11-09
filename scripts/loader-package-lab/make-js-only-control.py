"""Diagnostic only: preserve an old native APK payload and replace its JS bundle."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import zipfile

base = Path(os.environ['BASE_APK']).resolve()
candidate = Path(os.environ['CANDIDATE_APK']).resolve()
out = Path(os.environ['OUT']).resolve()
out.mkdir(parents=True, exist_ok=True)
sdk = Path(os.environ['ANDROID_HOME']) / 'build-tools' / '36.0.0'
bundle_name = 'assets/index.android.bundle'
hash_bytes = lambda value: hashlib.sha256(value).hexdigest()

def signature(name):
    return name.startswith('META-INF/') and name.endswith(('.SF', '.RSA', '.DSA', 'MANIFEST.MF'))

with zipfile.ZipFile(base) as old, zipfile.ZipFile(candidate) as new:
    assert not any(b'BloomComposerLightV1' in old.read(name) for name in old.namelist() if name.endswith('.dex'))
    bundle = new.read(bundle_name)
    with zipfile.ZipFile(out / 'unsigned.apk', 'w') as target:
        for info in old.infolist():
            if signature(info.filename):
                continue
            target.writestr(info, bundle if info.filename == bundle_name else old.read(info.filename))
subprocess.run([str(sdk / 'zipalign'), '-P', '16', '-f', '4', str(out / 'unsigned.apk'), str(out / 'aligned.apk')], check=True)
subprocess.run([str(sdk / 'apksigner'), 'sign', '--ks', os.environ['TEST_KEYSTORE'], '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', str(out / 'app-release.apk'), str(out / 'aligned.apk')], check=True)
certificate = subprocess.check_output([str(sdk / 'apksigner'), 'verify', '--print-certs', str(out / 'app-release.apk')], text=True)
(out / 'test-signature.txt').write_text(certificate)
retained = []
with zipfile.ZipFile(base) as old, zipfile.ZipFile(out / 'app-release.apk') as control:
    assert control.read(bundle_name) == bundle
    original = {n for n in old.namelist() if n != bundle_name and not signature(n)}
    result = {n for n in control.namelist() if n != bundle_name and not signature(n)}
    assert original == result, 'Unexpected added/removed native or resource payload'
    for name in sorted(original):
        payload = old.read(name)
        assert payload == control.read(name), f'Changed native/resource payload: {name}'
        if name.endswith(('.dex', '.so')):
            retained.append({'name': name, 'sha256': hash_bytes(payload)})
report = {
    'kind': 'diagnostic JS-only update into prior native binary, not a release candidate',
    'apkSha256': hash_bytes((out / 'app-release.apk').read_bytes()),
    'baseApkSha256': hash_bytes(base.read_bytes()),
    'candidateApkSha256': hash_bytes(candidate.read_bytes()),
    'embeddedBundleSha256': hash_bytes(bundle),
    'unchangedPayloadEntries': len(original),
    'unchangedNativePayload': retained,
    'testSignature': certificate,
    'limits': 'Current RN host only; no old RN/legacy runtime or fallback performance claim. All original resources are retained.',
}
(out / 'attestation.json').write_text(json.dumps(report, indent=2))
print(json.dumps({key: value for key, value in report.items() if key != 'unchangedNativePayload'}))
