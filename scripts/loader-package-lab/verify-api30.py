"""Compatibility and OS reduced-motion proof on the dedicated API 30 AVD only."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops
adb_args=[os.environ['ADB'],'-P','5037','-s','emulator-5582']
def raw(*args): return subprocess.check_output(adb_args+list(args))
def adb(*args): return raw(*args).decode().strip()
assert adb('emu','avd','name').splitlines()[0]=='bloom_loader_api30_663'
assert adb('shell','getprop','ro.kernel.qemu')=='1'
assert adb('shell','getprop','ro.build.version.sdk')=='30'
pkg='so.oxy.bloom.loaderpackagelab'
out=Path(os.environ['OUT']);out.mkdir(parents=True,exist_ok=True)
pid=adb('shell','pidof',pkg);assert pid
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','bloomProbe','snapshot')
time.sleep(2)
log=adb('logcat','-d','--pid='+pid);(out/'api30.log').write_text(log)
assert 'before count=0 mode=snapshot' in log and 'after count=0 mode=snapshot' in log
assert 'FATAL EXCEPTION' not in log
original=adb('shell','settings','get','global','transition_animation_scale')
try:
    adb('shell','settings','put','global','transition_animation_scale','0')
    time.sleep(1)
    path='/sdcard/bloom-loader-api30-663.xml'
    adb('shell','rm','-f',path)
    assert 'dumped to' in adb('shell','uiautomator','dump',path)
    xml=adb('shell','cat',path);(out/'reduced.xml').write_text(xml)
    tree=ET.fromstring(xml)
    node=next(n for n in tree.iter('node') if n.get('resource-id')=='benchmark-loader-one')
    box=list(map(int,re.findall(r'\d+',node.get('bounds'))))
    state=next(n for n in tree.iter('node') if n.get('resource-id')=='benchmark-state').get('text')
    assert 'active=true' in state and 'paused=false' in state
    for name in ['reduced-a','reduced-b']:
        (out/(name+'.png')).write_bytes(raw('exec-out','screencap','-p'));time.sleep(1.5)
    a=Image.open(out/'reduced-a.png').crop(box).convert('RGB');b=Image.open(out/'reduced-b.png').crop(box).convert('RGB')
    assert ImageChops.difference(a,b).getbbox() is None
finally:
    if original=='null': adb('shell','settings','delete','global','transition_animation_scale')
    else: adb('shell','settings','put','global','transition_animation_scale',original)
assert adb('shell','settings','get','global','transition_animation_scale')==original
time.sleep(1.2);(out/'resumed.png').write_bytes(raw('exec-out','screencap','-p'))
resumed=Image.open(out/'resumed.png').crop(box).convert('RGB')
assert ImageChops.difference(a,resumed).getbbox() is not None
report={'api':30,'managerViewCount':0,'svgVisible':True,'reducedMotionIdenticalPixels':True,'motionResumes':True,'bounds':box,'originalTransitionAnimationScale':original,'restoredExactly':True,'limitation':'SwiftShader compatibility only, no physical frame budget or optical parity claim'}
(out/'report.json').write_text(json.dumps(report,indent=2))
adb('shell','am','force-stop',pkg)
print(json.dumps(report))
