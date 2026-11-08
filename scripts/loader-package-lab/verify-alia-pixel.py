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
        if len(new)>=1: return new[0]
        time.sleep(.1)
    raise AssertionError('Input receipt missing')
def shot(name):
    foreground(); (out/(name+'.png')).write_bytes(raw('exec-out','screencap','-p'))
def retained(a,b):
    for k in ['identity','id','text','focused','attached']: assert a[k]==b[k], (k,a,b)
    assert sorted([a['start'],a['end']])==sorted([b['start'],b['end']]), ('selected range',a,b)
    assert b['focused'] and b['attached']

def state():
    return next(n for n in ui().iter('node') if n.get('resource-id')=='alia-state').get('text')
def input_point(tree):
    n=next(n for n in tree.iter('node') if n.get('class')=='android.widget.EditText')
    x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds')))
    return str((x+r)//2),str((y+b)//2)

# Coordinates are from full-viewport captures at 1080x2400, density420, font1.15.
# No system settings are changed. State text and attachments require visual review.
assert '1080x2400' in adb('shell','wm','size')
assert '420' in adb('shell','wm','density')
assert adb('shell','settings','get','system','font_scale')=='1.15'
adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','alia');time.sleep(5)
results={'scope':'Actual published Alia SDK composer in offline host, not full app',
         'geometry':'1080x2400, density420, font1.15',
         'uiDumpLimit':'Dictate accessibility events prevent UIAutomator idle; screenshot-verified coordinates used',
         'transitions':[]}
try:
    shot('initial')
    for control,point_value in [('resize',('230','234')),('busy',('550','234'))]:
        if control=='resize':
            tap(point_value);tap(('360','710'))
            adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
            before=inputs()
        else:
            before=inputs();tap(point_value)
        assert before['focused'] and before['start']!=before['end']
        time.sleep(4.5);after=inputs();retained(before,after);shot(control)
        results['transitions'].append({'control':control,'before':before,'after':after,
          'directionPreserved':(before['start'],before['end'])==(after['start'],after['end'])})
        if os.environ.get('EXPECT_DIRECTION')=='1':
            assert (before['start'],before['end'])==(after['start'],after['end'])
            adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
            extended=inputs()
            assert (extended['start'],extended['end'])==(before['start'],before['end']-1)
            results['transitions'][-1]['extended']=extended
    before=inputs();tap(('688','761'));time.sleep(.6)
    after=inputs();retained(before,after);shot('stopped')
    adb('shell','input','text','q');time.sleep(.4);typed=inputs()
    a,b=sorted([after['start'],after['end']])
    assert typed['text']==after['text'][:a]+'q'+after['text'][b:]
    assert typed['focused'] and typed['identity']==after['identity'];shot('typed')
    results['stop']={'before':before,'after':after,'typed':typed}
    adb('shell','input','keyevent','KEYCODE_BACK');time.sleep(.4)
    tap(('335','353'));time.sleep(.6);shot('attachment')
    results['status']='input identity/focus/text/range and replacement passed; visual state review required'
except Exception as error:
    results['status']='failed';results['error']=repr(error)
    raise
finally:
    (out/'report.json').write_text(json.dumps(results,indent=2))
    adb('shell','am','force-stop',pkg)
print(json.dumps(results))
