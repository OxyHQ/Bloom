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
        if len(new)>=2: return {n['testID']:n for n in new}
        time.sleep(.1)
    raise AssertionError('Input receipt missing')
def shot(name):
    foreground(); (out/(name+'.png')).write_bytes(raw('exec-out','screencap','-p'))
def retained(a,b):
    for k in ['identity','id','text','focused','attached']: assert a[k]==b[k], (k,a,b)
    assert sorted([a['start'],a['end']])==sorted([b['start'],b['end']]), ('selected range',a,b)
    assert b['focused'] and b['attached']
adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','composers');time.sleep(3)
results={}
for owner in ['cases-pill-input','cases-agent-pill-input']:
    cases=[]
    for control in ['cases-resize','cases-busy']:
        tree=ui(); control_point=point(tree,control); input_point=point(tree,owner)
        # Timer gives time to focus via a real touch before the state change.
        tap(control_point); tap(input_point)
        adb('shell','input','keycombination','KEYCODE_SHIFT_LEFT','KEYCODE_DPAD_LEFT')
        before=inputs()[owner]; assert before['focused']
        assert before['start'] != before['end'], 'Real key chord did not select text'
        time.sleep(4.2)
        after=inputs()[owner]; retained(before,after)
        changed=ui()
        state=next(n for n in changed.iter('node') if n.get('resource-id')=='cases-state').get('text')
        assert ('narrow=true' if control=='cases-resize' else 'busy=true') in state
        shot(owner+'-'+control)
        cases.append({'control':control,'state':state,'before':before,'after':after})
    stop_tree=ui()
    stop_nodes=[n for n in stop_tree.iter('node') if n.get('content-desc')=='Stop generating' and n.get('clickable')=='true']
    assert len(stop_nodes)==2
    stop_node=stop_nodes[0 if owner=='cases-pill-input' else 1]
    x,y,r,b=map(int,re.findall(r'\d+',stop_node.get('bounds')))
    before_stop=inputs()[owner]
    tap((str((x+r)//2),str((y+b)//2)));time.sleep(.6)
    after_stop=inputs()[owner];retained(before_stop,after_stop)
    tree=ui();state=next(n for n in tree.iter('node') if n.get('resource-id')=='cases-state').get('text')
    assert 'busy=false' in state and ('stops=1' if owner=='cases-pill-input' else 'stops=2') in state
    adb('shell','input','text','q');time.sleep(.3)
    typed=inputs()[owner]
    assert typed['identity']==after_stop['identity'] and typed['focused']
    start,end=sorted([after_stop['start'],after_stop['end']])
    assert typed['text']==after_stop['text'][:start]+'q'+after_stop['text'][end:]
    shot(owner+'-stop-and-type')
    results[owner]={'transitions':cases,'stop':{'before':before_stop,'after':after_stop,'state':state},'typed':typed}
    # Restore idle/full width between owners without touching another application.
    adb('shell','input','keyevent','KEYCODE_BACK')
    tree=ui(); state=next(n for n in tree.iter('node') if n.get('resource-id')=='cases-state').get('text')
    for control,flag in [('cases-busy','busy=true'),('cases-resize','narrow=true')]:
        if flag in state: tap(point(tree,control));time.sleep(4.3);tree=ui()
(out/'report.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
adb('shell','am','force-stop',pkg)
