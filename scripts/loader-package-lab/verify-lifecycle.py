"""Physical packaged renderer lifecycle; never capture outside the synthetic app."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops

serial = os.environ['ANDROID_SERIAL']
assert serial == os.environ['AUTHORIZED_PHYSICAL_SERIAL']
adb_base = [os.environ['ADB'], '-P', os.environ['ADB_PORT'], '-s', serial]
pkg = 'so.oxy.bloom.loaderpackagelab'
out = Path(os.environ['OUT']).resolve(); out.mkdir(parents=True, exist_ok=True)
def raw(*args): return subprocess.check_output(adb_base + list(args))
def adb(*args): return raw(*args).decode().strip()
def foreground():
    assert any(pkg in line and re.search(r'mResumedActivity|topResumedActivity|ResumedActivity:', line) for line in adb('shell', 'dumpsys', 'activity', 'activities').splitlines())
def ui():
    foreground()
    path = '/sdcard/bloom-loader-lifecycle-663.xml'
    adb('shell', 'rm', '-f', path)
    assert 'dumped to' in adb('shell', 'uiautomator', 'dump', path)
    return ET.fromstring(adb('shell', 'cat', path))
def node(name):
    match = next((n for n in ui().iter('node') if n.get('resource-id') == name), None)
    assert match is not None, name
    return match

def bounds(name): return list(map(int, re.findall(r'\d+', node(name).get('bounds'))))
def tap(name):
    x, y, r, b = bounds(name)
    adb('shell', 'input', 'tap', str((x+r)//2), str((y+b)//2))
def shot(name):
    foreground(); path=out/f'{name}.png'; path.write_bytes(raw('exec-out', 'screencap', '-p')); return path

def clock():
    foreground(); pid = adb('shell', 'pidof', pkg)
    def records():
        return [json.loads(line.split('BloomPackageClock: ', 1)[1]) for line in adb('logcat', '-d', '--pid='+pid).splitlines() if 'BloomPackageClock: {' in line]
    before=records(); previous=before[-1]['wallMs'] if before else -1
    adb('shell', 'am', 'start', '-n', pkg+'/.MainActivity', '--es', 'bloomProbe', 'clock')
    for _ in range(30):
        rows=records()
        if rows and rows[-1]['wallMs'] > previous: return rows[-1]
        time.sleep(.1)
    raise AssertionError('Missing native clock receipt')
def identical(a,b,box):
    return ImageChops.difference(Image.open(a).crop(box).convert('RGB'), Image.open(b).crop(box).convert('RGB')).getbbox() is None

results={}
foreground()
assert 'count=1 taper=0 active=true speed=4.5' in node('benchmark-state').get('text')
box=bounds('benchmark-loader-one')
tap('benchmark-pause'); time.sleep(.3)
a=clock(); before=shot('paused-before'); time.sleep(1.5); b=clock(); after=shot('paused-after')
assert a['seconds']==b['seconds'] and identical(before,after,box)
tap('benchmark-pause'); time.sleep(.4); c=clock()
assert .1 < c['seconds']-b['seconds'] < 1.5
results['pause']={'before':a,'after':b,'resumed':c,'identicalPixels':True,'bounds':box}

tap('benchmark-screen-mode'); time.sleep(.3); box=bounds('benchmark-loader-one')
tap('benchmark-screen-mode'); time.sleep(.3)
a=clock(); before=shot('inactive-before'); time.sleep(1.5); b=clock(); after=shot('inactive-after')
assert a['seconds']==b['seconds'] and identical(before,after,box)
tap('benchmark-screen-mode'); time.sleep(.4); c=clock()
assert .1 < c['seconds']-b['seconds'] < 1.5
results['screenInactive']={'before':a,'after':b,'resumed':c,'identicalPixels':True,'bounds':box}

a=clock(); pid=adb('shell','pidof',pkg)
adb('shell','input','keyevent','KEYCODE_HOME'); time.sleep(2.5)
adb('shell','am','start','-n',pkg+'/.MainActivity'); time.sleep(.2)
assert adb('shell','pidof',pkg)==pid
b=clock(); wall=(b['wallMs']-a['wallMs'])/1000; delta=b['seconds']-a['seconds']
assert wall-delta > 2, 'Background time leaked into the active frame clock'
time.sleep(.4); c=clock(); assert c['seconds']>b['seconds']
results['background']={'before':a,'after':b,'continued':c,'wallSeconds':wall,'activeSeconds':delta}

before_resize=clock()
tap('benchmark-width'); time.sleep(.3); a=clock(); assert abs(a['width']-240)<.5
resize_wall=(a['wallMs']-before_resize['wallMs'])/1000
resize_delta=a['seconds']-before_resize['seconds']
assert resize_delta >= 0 and abs(resize_delta-resize_wall)<.25
shot('resized')
results['resize']={'before':before_resize,'after':a,'wallSeconds':resize_wall,'activeSeconds':resize_delta,'toleranceSeconds':.25}
x,y,r,b=bounds('benchmark-motion'); point=[str((x+r)//2),str((y+b)//2)]
started=time.monotonic(); adb('shell','input','tap',*point); adb('shell','input','tap',*point); elapsed=(time.monotonic()-started)*1000
assert elapsed<450, 'Toggle did not interrupt the fade'
time.sleep(.6); assert 'active=true' in node('benchmark-state').get('text'); shot('rapid-resume')
results['rapidToggleMs']=elapsed

adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--ez','initialActive','false')
time.sleep(3)
assert 'active=false' in node('benchmark-state').get('text')
a=clock(); time.sleep(1); b=clock(); assert a['seconds']==b['seconds']==0
shot('initial-inactive'); results['initialInactive']={'before':a,'after':b}
(out/'report.json').write_text(json.dumps(results,indent=2))
adb('shell','am','force-stop',pkg)
print(json.dumps(results))
