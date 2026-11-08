"""Touch-driven identity/caret/draft checks on the actual packaged composer owners."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
serial=os.environ['ANDROID_SERIAL']; assert serial==os.environ['AUTHORIZED_PHYSICAL_SERIAL']
base=[os.environ['ADB'],'-P',os.environ['ADB_PORT'],'-s',serial]
pkg='so.oxy.bloom.loaderpackagelab'
out=Path(os.environ['OUT']); out.mkdir(parents=True,exist_ok=True)
def raw(*args): return subprocess.check_output(base+list(args))
def adb(*args): return raw(*args).decode().strip()
def foreground():
    assert any(pkg in line and re.search(r'mResumedActivity|topResumedActivity|ResumedActivity:',line) for line in adb('shell','dumpsys','activity','activities').splitlines())
def ui():
    foreground(); path='/sdcard/bloom-composers-663.xml'
    adb('shell','rm','-f',path); assert 'dumped to' in adb('shell','uiautomator','dump',path)
    return ET.fromstring(adb('shell','cat',path))
def point(tree,name):
    n=next(n for n in tree.iter('node') if n.get('resource-id')==name)
    x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds'))); return str((x+r)//2),str((y+b)//2)
def tap(p): adb('shell','input','tap',*p)
def inputs():
    foreground(); pid=adb('shell','pidof',pkg)
    def rows(): return [json.loads(line.split('BloomInputProbe: ',1)[1]) for line in adb('logcat','-d','--pid='+pid).splitlines() if 'BloomInputProbe: {' in line]
    old=len(rows()); adb('shell','am','start','-n',pkg+'/.MainActivity','--es','bloomProbe','inputs')
    for _ in range(20):
        new=rows()[old:]
        if len(new)>=1: return {n['testID']:n for n in new}
        time.sleep(.1)
    raise AssertionError('Input receipt missing')
def shot(name):
    foreground(); (out/(name+'.png')).write_bytes(raw('exec-out','screencap','-p'))
def retained(a,b):
    for k in ['identity','id','text','focused','attached']: assert a[k]==b[k], (k,a,b)
    assert sorted([a['start'],a['end']])==sorted([b['start'],b['end']]), ('selected range',a,b)
    assert b['focused'] and b['attached']
results={}
for transition in ['none','resize','busy']:
    adb('shell','am','force-stop',pkg)
    adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene',os.environ.get('SCENE','composers'));time.sleep(3)
    tree=ui(); target=point(tree,'cases-pill-input')
    if os.environ.get('TRACE_SELECTION')=='1': adb('shell','am','start','-n',pkg+'/.MainActivity','--es','bloomProbe','traceSelection')
    if transition!='none': tap(point(tree,'cases-'+transition))
    tap(target)
    adb('shell','input','keycombination','KEYCODE_CTRL_LEFT','KEYCODE_MOVE_HOME')
    adb('shell','input','keyevent','KEYCODE_DPAD_RIGHT','KEYCODE_DPAD_RIGHT','KEYCODE_DPAD_RIGHT','KEYCODE_DPAD_RIGHT','KEYCODE_DPAD_RIGHT')
    adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
    before=inputs()['cases-pill-input']
    assert sorted([before['start'],before['end']])==[4,5], before
    time.sleep(4.2)
    settled=inputs()['cases-pill-input']
    adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
    extended=inputs()['cases-pill-input']
    state=next(n for n in ui().iter('node') if n.get('resource-id')=='cases-state').get('text')
    if transition!='none': assert ('narrow=true' if transition=='resize' else 'busy=true') in state
    shot('direction-'+transition)
    results[transition]={'before':before,'settled':settled,'extended':extended,'state':state}
    (out/'report.json').write_text(json.dumps(results,indent=2))
baseline=results['none']['extended']
for name in ['resize','busy']:
    actual=results[name]['extended']
    assert [actual['start'],actual['end']]==[baseline['start'],baseline['end']], (name,baseline,actual)
adb('shell','am','force-stop',pkg)
print(json.dumps(results))
