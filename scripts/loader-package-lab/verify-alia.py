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
adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','alia');time.sleep(4)
results={'scope':'Published Alia SDK composer in offline host; not the full Alia app', 'transitions':[]}
try:
    tree=ui(); (out/'initial.xml').write_text(ET.tostring(tree,encoding='unicode')); shot('initial')
    for control,flag in [('alia-resize','narrow=true'),('alia-busy','busy=true')]:
        tree=ui(); position=input_point(tree)
        tap(point(tree,control)); tap(position)
        adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
        before=inputs(); assert before['focused'] and before['start']!=before['end']
        time.sleep(4.2)
        after=inputs(); retained(before,after)
        current=state(); assert flag in current,current
        shot(control)
        results['transitions'].append({'control':control,'before':before,'after':after,'state':current})
    tree=ui(); (out/'busy.xml').write_text(ET.tostring(tree,encoding='unicode'))
    stops=[n for n in tree.iter('node') if n.get('content-desc')=='Stop generating' and n.get('clickable')=='true']
    assert len(stops)==1,[(n.get('text'),n.get('content-desc')) for n in tree.iter('node') if n.get('clickable')=='true']
    x,y,r,b=map(int,re.findall(r'\d+',stops[0].get('bounds')))
    before=inputs();tap((str((x+r)//2),str((y+b)//2)));time.sleep(.6)
    after=inputs();retained(before,after)
    current=state();assert 'stops=1' in current and 'busy=false' in current,current
    adb('shell','input','text','q');time.sleep(.3)
    typed=inputs(); start,end=sorted([after['start'],after['end']])
    assert typed['text']==after['text'][:start]+'q'+after['text'][end:]
    assert typed['focused'] and typed['identity']==after['identity']
    results['stop']={'before':before,'after':after,'typed':typed,'state':current};shot('stop-typed')
    adb('shell','input','keyevent','KEYCODE_BACK');time.sleep(.4)
    tree=ui();tap(point(tree,'alia-attachment'));time.sleep(.5)
    tree=ui();(out/'attachment.xml').write_text(ET.tostring(tree,encoding='unicode'));shot('attachment')
    assert any('Offline note.txt' in (n.get('text','')+n.get('content-desc','')) for n in tree.iter('node'))
    results['attachmentVisible']=True
    results['status']='passed'
except Exception as error:
    results['status']='failed';results['error']=repr(error)
    raise
finally:
    (out/'report.json').write_text(json.dumps(results,indent=2))
    adb('shell','am','force-stop',pkg)
print(json.dumps(results))
