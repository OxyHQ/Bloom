# Observational interaction harness, not a published-package acceptance claim.
import subprocess,time,pathlib,xml.etree.ElementTree as ET,json,os
adb=[os.environ['ADB']] + (['-P',os.environ['ADB_PORT']] if os.environ.get('ADB_PORT') else []) + ['-s',os.environ['ANDROID_SERIAL']]
app=os.environ['APP_ID']
r=pathlib.Path(os.environ['OUTPUT']);r.mkdir(parents=True,exist_ok=False)
def call(*args):return subprocess.check_output(adb+list(args))
def tree():
 windows=call('shell','dumpsys','window').decode()
 assert any(app in line and ('mCurrentFocus' in line or 'mFocusedApp' in line) for line in windows.splitlines()), 'Fixture must own foreground'
 call('shell','uiautomator','dump','/sdcard/editor434-handoff.xml')
 return call('exec-out','cat','/sdcard/editor434-handoff.xml')
def bounds(n):return [int(v) for v in n.get('bounds').replace('][',',').replace('[','').replace(']','').split(',')]
def tap(kind,value,x=None):
 d=ET.fromstring(tree());n=next(n for n in d.iter('node') if n.get(kind)==value)
 a,b,c,e=bounds(n);call('shell','input','tap',str(x or (a+c)//2),str((b+e)//2));time.sleep(1.5)
def capture(name):
 x=tree();(r/f'{name}.xml').write_bytes(x);(r/f'{name}.png').write_bytes(call('exec-out','screencap','-p'))
 n=next(n for n in ET.fromstring(x).iter('node') if n.get('resource-id')=='editor-native-state')
 state=json.loads(n.get('text'));print(name,json.dumps(state),flush=True);return state
results={}
tap('resource-id','block-input-fixture-1',245);results['caret']=capture('caret')
tap('content-desc','Link');results['editing']=capture('editing')
call('shell','input','keyevent','123');call('shell','input','text','changed')
tap('content-desc','Apply');results['apply']=capture('apply')
tap('content-desc','Link');tap('content-desc','Cancel');results['cancel']=capture('cancel')
tap('content-desc','Link');tap('resource-id','block-input-fixture-2',200);results['external']=capture('external')
tap('resource-id','block-input-fixture-1',245);tap('content-desc','Link')
call('shell','input','keyevent','4');time.sleep(1);results['back']=capture('back')
tap('content-desc','Cancel');results['afterBackCancel']=capture('after-back-cancel')
tap('content-desc','Link');call('shell','input','keyevent','111');time.sleep(1);results['injectedEscape']=capture('injected-escape')
(r/'report.json').write_text(json.dumps(results,indent=2));(r/'events.log').write_bytes(call('logcat','-d','-v','threadtime','EDITOR434_NATIVE:I','ReactNativeJS:I','AndroidRuntime:E','*:S'))
