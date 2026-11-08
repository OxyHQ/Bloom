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
