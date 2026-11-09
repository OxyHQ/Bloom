"""Packaged hardware-adapter reduced-motion proof on the owned API 36 AVD only."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops
adb_args=[os.environ['ADB'],'-P','5037','-s','emulator-5580']
def raw(*args): return subprocess.check_output(adb_args+list(args))
def adb(*args): return raw(*args).decode().strip()
assert adb('emu','avd','name').splitlines()[0]=='bloom_material_663'
assert adb('shell','getprop','ro.kernel.qemu')=='1'
api=int(adb('shell','getprop','ro.build.version.sdk')); assert api>=31
pkg='so.oxy.bloom.loaderpackagelab'
out=Path(os.environ['OUT']);out.mkdir(parents=True,exist_ok=True)
def foreground():
    assert any('mCurrentFocus' in line and pkg in line for line in adb('shell','dumpsys','window').splitlines()), 'Synthetic window must have focus; dismiss emulator startup dialogs before probing'
foreground()
pid=adb('shell','pidof',pkg);assert pid
previous=adb('logcat','-d','--pid='+pid).count('after count=1 mode=snapshot')
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','bloomProbe','snapshot')
for _ in range(30):
    log=adb('logcat','-d','--pid='+pid)
    if log.count('after count=1 mode=snapshot')>previous: break
    time.sleep(1)
(out/'hardware-adapter.log').write_text(log)
assert 'before count=1 mode=snapshot' in log and 'after count=1 mode=snapshot' in log
assert 'FATAL EXCEPTION' not in log
original=adb('shell','settings','get','global','transition_animation_scale')
try:
    adb('shell','settings','put','global','transition_animation_scale','0')
    time.sleep(1)
    path='/sdcard/bloom-loader-hardware-663.xml'
    adb('shell','rm','-f',path)
    assert 'dumped to' in adb('shell','uiautomator','dump',path)
    xml=adb('shell','cat',path);(out/'reduced.xml').write_text(xml)
    foreground()
    tree=ET.fromstring(xml)
    node=next(n for n in tree.iter('node') if n.get('resource-id')=='benchmark-loader-one')
    box=list(map(int,re.findall(r'\d+',node.get('bounds'))))
    state=next(n for n in tree.iter('node') if n.get('resource-id')=='benchmark-state').get('text')
    assert 'active=true' in state and 'paused=false' in state
    for name in ['reduced-a','reduced-b']:
        foreground()
        (out/(name+'.png')).write_bytes(raw('exec-out','screencap','-p'));time.sleep(1.5)
    a=Image.open(out/'reduced-a.png').crop(box).convert('RGB');b=Image.open(out/'reduced-b.png').crop(box).convert('RGB')
    assert ImageChops.difference(a,b).getbbox() is None
finally:
    if original=='null': adb('shell','settings','delete','global','transition_animation_scale')
    else: adb('shell','settings','put','global','transition_animation_scale',original)
assert adb('shell','settings','get','global','transition_animation_scale')==original
time.sleep(1.2);foreground();(out/'resumed.png').write_bytes(raw('exec-out','screencap','-p'))
resumed=Image.open(out/'resumed.png').crop(box).convert('RGB')
assert ImageChops.difference(a,resumed).getbbox() is not None
report={'api':api,'managerViewCount':1,'hardwareAdapterVisible':True,'reducedMotionIdenticalPixels':True,'motionResumes':True,'bounds':box,'originalTransitionAnimationScale':original,'restoredExactly':True,'limitation':'Emulated hardware Canvas lifecycle only, no physical frame budget or optical parity claim'}
(out/'report.json').write_text(json.dumps(report,indent=2))
adb('shell','am','force-stop',pkg)
print(json.dumps(report))
