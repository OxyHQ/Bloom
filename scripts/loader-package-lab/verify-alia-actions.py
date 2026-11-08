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

def named(tree, label):
    n=next(n for n in tree.iter('node') if n.get('content-desc')==label and n.get('clickable')=='true')
    x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds')))
    return str((x+r)//2),str((y+b)//2)
adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','alia');time.sleep(4)
result={}
try:
    tree=ui();(out/'initial.xml').write_text(ET.tostring(tree,encoding='unicode'))
    tap(point(tree,'alia-attachment'));time.sleep(.5);tree=ui()
    shot('attached');tap(named(tree,'Remove Offline note.txt'));time.sleep(.5);tree=ui()
    assert not any(n.get('content-desc')=='Remove Offline note.txt' for n in tree.iter('node'))
    result['attachmentRemoved']=True;shot('removed')
    tap(input_point(tree));before=inputs();assert before['focused']
    tree=ui();tap(named(tree,'Send message'));time.sleep(.5)
    after=inputs();retained(before,after);current=state()
    assert 'submits=1' in current and 'busy=true' in current,current
    result['submit']={'before':before,'after':after,'state':current};shot('submitted')
    tap(named(ui(),'Stop generating'));time.sleep(.5);stopped=inputs();retained(after,stopped)
    current=state();assert 'stops=1' in current and 'busy=false' in current,current
    result['stop']={'input':stopped,'state':current};shot('stopped')
    result['status']='passed'
except Exception as error:
    result['status']='failed';result['error']=repr(error);raise
finally:
    (out/'report.json').write_text(json.dumps(result,indent=2))
    adb('shell','am','force-stop',pkg)
print(json.dumps(result))
