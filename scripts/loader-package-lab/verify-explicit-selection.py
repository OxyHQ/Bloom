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
try:
  for name,start,end in [('forward',4,10),('backward',10,4),('collapsed',7,7)]:
    adb('shell','am','force-stop',pkg)
    adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','raw-fixed');time.sleep(3)
    tree=ui();target=point(tree,'cases-pill-input')
    tap(point(tree,'cases-selection-'+name));tap(target)
    before=inputs()['cases-pill-input'];time.sleep(4.4)
    after=inputs()['cases-pill-input'];shot('explicit-'+name)
    results[name]={'before':before,'after':after,'expected':[start,end]}
    assert [after['start'],after['end']]==[start,end], results[name]
    assert before['identity']==after['identity'] and after['focused'] and before['text']==after['text']
finally:
  (out/'report.json').write_text(json.dumps(results,indent=2))
  adb('shell','am','force-stop',pkg)
print(json.dumps(results))
