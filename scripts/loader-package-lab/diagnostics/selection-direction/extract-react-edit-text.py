"""Archive the actual R8 ReactEditText class disassembly from an attested APK."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

apk = Path(os.environ['APK'])
mapping = Path(os.environ['MAPPING'])
out = Path(os.environ['OUT'])
out.mkdir(parents=True, exist_ok=True)
match = re.search(r'^com\.facebook\.react\.views\.textinput\.ReactEditText -> ([^:]+):$', mapping.read_text(), re.M)
assert match, 'ReactEditText absent from R8 mapping'
descriptor = 'L' + match[1].replace('.', '/') + ';'
blocks = []
with zipfile.ZipFile(apk) as archive, tempfile.TemporaryDirectory() as temp:
    for name in archive.namelist():
        if not re.fullmatch(r'classes\d*\.dex', name):
            continue
        payload = archive.read(name)
        if descriptor.encode() not in payload:
            continue
        dex = Path(temp) / name
        dex.write_bytes(payload)
        process = subprocess.Popen([os.environ['DEXDUMP'], '-d', str(dex)], stdout=subprocess.PIPE, text=True, errors='backslashreplace')
        selected = False
        block = []
        for line in process.stdout:
            if line.startswith('Class #'):
                if selected:
                    blocks.append((name, ''.join(block)))
                selected = False
                block = []
            if 'Class descriptor' in line:
                selected = f"'{descriptor}'" in line
            if selected:
                block.append(line)
        if selected:
            blocks.append((name, ''.join(block)))
        assert process.wait() == 0
assert len(blocks) == 1, f'Expected one class definition, got {len(blocks)}'
name, code = blocks[0]
(out / 'ReactEditText.dex.txt').write_text(code)
(out / 'dex-receipt.json').write_text(json.dumps({
    'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'mappingSha256': hashlib.sha256(mapping.read_bytes()).hexdigest(),
    'dexEntry': name, 'descriptor': descriptor,
    'disassemblySha256': hashlib.sha256(code.encode()).hexdigest(),
    'scope': 'Actual APK class disassembly; inspect control flow and compare baseline/candidate, presence alone does not prove the fix',
}, indent=2) + '\n')
print(name, descriptor, len(code))

# Verify the actual method, not merely a class name or string marker in DEX.
source_mapping = mapping.read_text().split('com.facebook.react.views.textinput.ReactEditText -> ', 1)[1].split('\ncom.', 1)[0]
method = set(re.findall(r'maybeSetText\(com\.facebook\.react\.views\.text\.ReactTextUpdate\).* -> (\w+)', source_mapping))
restore = set(re.findall(r'maybeSetSelection\(int,int\).* -> (\w+)', source_mapping))
assert len(method) == len(restore) == 1
method_code = code.split("name          : '" + next(iter(method)) + "'", 1)[1].split('\n    #', 1)[0]
markers = {'saveStart': '.getSelectionStart:', 'saveEnd': '.getSelectionEnd:',
           'replace': '.replace:', 'restore': descriptor + '.' + next(iter(restore)) + ':(II)V'}
offsets = {key: method_code.find(value) for key, value in markers.items()}
if os.environ.get('EXPECT_SELECTION_RESTORE') == '1':
    assert 0 <= offsets['saveStart'] < offsets['saveEnd'] < offsets['replace'] < offsets['restore'], offsets
elif os.environ.get('EXPECT_SELECTION_RESTORE') == '0':
    assert offsets['saveStart'] == offsets['saveEnd'] == offsets['restore'] == -1, offsets
(out / 'method-inspection.json').write_text(json.dumps({'method': next(iter(method)), 'markerOffsets': offsets}, indent=2) + '\n')
