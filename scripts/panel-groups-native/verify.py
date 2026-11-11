import subprocess,xml.etree.ElementTree as ET,re,json,time,os
from pathlib import Path
serial=os.environ['ANDROID_SERIAL']
out=Path(os.environ.get('ARTIFACT_DIR','.local/panel-groups-native'));out.mkdir(parents=True,exist_ok=True)
identity=json.loads(Path(__file__).with_name('build.json').read_text())['identity'][:8]
def adb(*args): return subprocess.check_output(['adb','-s',serial,*args])
def tree(name):
 adb('shell','uiautomator','dump','/sdcard/panel-groups-ui.xml')
 data=adb('shell','cat','/sdcard/panel-groups-ui.xml')
 assert any(n.get('package')=='so.oxy.bloom.panelgroupslab' for n in ET.fromstring(data).iter('node')), 'Fixture is no longer foregrounded'
 (out/f'{name}.xml').write_bytes(data)
 (out/f'{name}.png').write_bytes(adb('exec-out','screencap','-p'))
 return ET.fromstring(data)
def node(t,id):return next(n for n in t.iter('node') if n.get('resource-id')==id)
def bounds(n):return list(map(int,re.findall(r'\d+',n.get('bounds'))))
def tap(t,id):
 x1,y1,x2,y2=bounds(node(t,id));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
def rows(t,prefix): return [n.get('text') for n in t.iter('node') if n.get('text','').startswith(prefix+' row') and bounds(n)[3] > bounds(n)[1]]
report={}
adb('shell','am','force-stop','so.oxy.bloom.panelgroupslab')
adb('shell','am','start','-n','so.oxy.bloom.panelgroupslab/.MainActivity')
time.sleep(2)
t=tree('native-initial');assert any(n.get('text')=='Panels '+identity for n in t.iter('node'))
screen=bounds(next(t.iter('node')));center=str((screen[0]+screen[2])//2);height=screen[3]
tap(t,'native-open');t=tree('native-split')
report['split']={k:bounds(node(t,k)) for k in ['native-post-panel','native-likes-panel']}
p=report['split']['native-post-panel'];l=report['split']['native-likes-panel'];assert p[3]<=l[1] and l[3]>l[1] and abs((p[3]-p[1])-(l[3]-l[1]))<5
before=rows(t,'Post'); likesBefore=rows(t,'Likes')
adb('shell','input','swipe',center,str(p[3]-50),center,str(p[1]+250),'450');t=tree('native-post-scrolled')
assert rows(t,'Post')!=before;assert rows(t,'Likes')==likesBefore
postAfter=rows(t,'Post');adb('shell','input','swipe',center,str(l[3]-250),center,str(l[1]+250),'450');t=tree('native-likes-scrolled')
assert rows(t,'Post')==postAfter;assert rows(t,'Likes')!=likesBefore
report['independentNativeScroll']=True
tap(t,'native-open');t=tree('native-closed');assert not rows(t,'Likes');assert rows(t,'Post')[0]==postAfter[0]
report['closeRetainsReadingPosition']=True
tap(t,'native-sheet');t=tree('native-sheet');report['sheetText']=[n.get('text') for n in t.iter('node') if n.get('text')]
assert rows(t,'Likes');adb('shell','input','keyevent','4');t=tree('native-sheet-closed');assert not rows(t,'Likes')
report['nativeSheetAndBackDismiss']=True
tap(t,'native-flow');t=tree('native-flow');report['flowInitial']=[n.get('text') for n in t.iter('node') if n.get('text','').startswith('Email ')]
adb('shell','input','swipe',center,str(round(height*.85)),center,str(round(height*.3)),'500');t=tree('native-flow-scrolled');report['flowScrolled']=[n.get('text') for n in t.iter('node') if n.get('text','').startswith('Email ')]
assert report['flowInitial']!=report['flowScrolled']
tap(t,'native-add');adb('shell','input','swipe',center,str(round(height*.85)),center,str(round(height*.3)),'500');t=tree('native-flow-added');assert any(n.get('text')=='Email 4' for n in t.iter('node'))
report['nativeFlowAddsScrollContent']=True
(out/'native-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
