"""Touch-driven identity/caret/draft checks on the actual packaged composer owners."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
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
        identified={n['testID']:n for n in new if n.get('testID')}
        if {'cases-pill-input','cases-agent-pill-input'} <= identified.keys(): return identified
        time.sleep(.1)
    raise AssertionError('Input receipt missing')
def shot(name):
    foreground()
    destination=out / (name + '.png')
    direct_error=None
    force_pull=os.environ.get('BLOOM_COMPOSER_CAPTURE')=='shell-pull'
    image=None
    if not force_pull:
        try:
            result=subprocess.run(
                base+['exec-out','screencap','-p'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=12,
                check=True,
            )
            image=result.stdout
        except (subprocess.TimeoutExpired,subprocess.CalledProcessError) as error:
            direct_error=type(error).__name__
    else:
        direct_error='forced shell-pull capture'
    if direct_error:
        remote='/sdcard/bloom-composers-663-capture.png'
        subprocess.run(
            base+['shell','screencap','-p',remote],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=12,
            check=True,
        )
        with tempfile.TemporaryDirectory(prefix='bloom-composer-shot-') as temporary:
            local=Path(temporary)/'capture.png'
            subprocess.run(
                base+['pull',remote,str(local)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=12,
                check=True,
            )
            image=local.read_bytes()
        transport='shell-screencap+pull'
    else:
        transport='exec-out'
    assert image is not None
    if len(image)<1024 or image[:8]!=b'\x89PNG\r\n\x1a\n':
        raise AssertionError(f'Invalid PNG screenshot for {name}: {len(image)} bytes via {transport}')
    destination.write_bytes(image)
    if direct_error:
        print(json.dumps({'screenshot':name,'transport':transport,'directError':direct_error,'bytes':len(image)}),flush=True)
def retained(a,b):
    for k in ['identity','id','text','focused','attached']: assert a[k]==b[k], (k,a,b)
    assert sorted([a['start'],a['end']])==sorted([b['start'],b['end']]), ('selected range',a,b)
    assert b['focused'] and b['attached']
def retained_across_rotation(a,b):
    for k in ['text','focused','attached']: assert a[k]==b[k], (k,a,b)
    assert [a['start'],a['end']]==[b['start'],b['end']], ('selection direction',a,b)
    assert b['focused'] and b['attached']
def orientation():
    return int(ui().get('rotation','-1'))
def user_rotation():
    values=adb('shell','cmd','window','user-rotation').split()
    mode=values[0]
    # Android 16 returns only "free" while rotation is sensor-controlled;
    # older versions may also print the remembered user rotation.
    value=values[1] if len(values)>1 else adb('shell','settings','get','system','user_rotation')
    return mode, int(value)
def wait_orientation(expected):
    for _ in range(60):
        if orientation()==expected: return
        time.sleep(.2)
    raise AssertionError(f'Expected display rotation {expected}, got {orientation()}')
def ime_visible():
    state=adb('shell','dumpsys','input_method')
    # Pixel 8a API 36 reports isShowing=false while Gboard is visibly drawn.
    return bool(re.search(r'\bisShowing:\s*true\b|\bmInputShown\s*=\s*true\b',state,re.I) and re.search(r'\bmImeWindowVis=3\b',state))
def dismiss_ime():
    for _ in range(3):
        if not ime_visible(): return
        adb('shell','input','keyevent','KEYCODE_BACK');time.sleep(.3)
    assert not ime_visible(), 'Keyboard/selection toolbar did not dismiss'
def select_all(owner):
    adb('shell','input','keycombination','KEYCODE_CTRL_LEFT','KEYCODE_A')
    selected=inputs()[owner]
    assert selected['focused'] and selected['start']!=selected['end'], selected
    return selected
def rotate_and_check(owner):
    old_mode,old_user=user_rotation()
    old_orientation=orientation()
    assert old_orientation in (0,1), old_orientation
    before=select_all(owner)
    assert ime_visible(), 'Keyboard must be visible before rotation'
    shot(owner+'-rotation-before')
    target=0 if old_orientation==1 else 1
    try:
        adb('shell','cmd','window','user-rotation','lock',str(target))
        wait_orientation(target)
        time.sleep(.8)
        after=inputs()[owner]
        shot(owner+'-rotation-'+str(target))
        retained_across_rotation(before,after)
        assert ime_visible(), 'Keyboard closed during rotation'
        returned=0 if target==1 else 1
        adb('shell','settings','put','system','user_rotation',str(returned))
        wait_orientation(returned)
        time.sleep(.8)
        restored=inputs()[owner]
        shot(owner+'-rotation-'+str(returned))
        retained_across_rotation(before,restored)
        assert ime_visible(), 'Keyboard closed after returning from rotation'
        return {'before':before,'rotated':after,'returned':restored,'nativeViewStable':before['identity']==after['identity']==restored['identity'],'startOrientation':old_orientation,'targetOrientation':target,'keyboardVisibleThroughout':True,'selectionMethod':'Ctrl+A on focused native EditText'}
    finally:
        if old_mode=='free': adb('shell','cmd','window','user-rotation','free')
        else: adb('shell','cmd','window','user-rotation',old_mode,str(old_user))
        wait_orientation(old_orientation)
adb('shell','am','force-stop',pkg)
adb('shell','am','start','-n',pkg+'/.MainActivity','--es','scene','composers');time.sleep(3)
results={}
for owner in ['cases-pill-input','cases-agent-pill-input']:
    cases=[]
    for control in ['cases-resize','cases-busy']:
        # The previous transition leaves Gboard open. Its overlay covers the
        # center of the EditText bounds, so dismiss it before taking new points.
        dismiss_ime()
        tree=ui(); control_point=point(tree,control)
        # Timer gives time to focus via a real touch before the state change.
        pending_name='resize' if control=='cases-resize' else 'busy'
        tap(control_point); time.sleep(.3)
        tree=ui()
        state=next(n for n in tree.iter('node') if n.get('resource-id')=='cases-state').get('text')
        if 'pending='+pending_name not in state:
            # Android may consume the first tap while the IME window is
            # settling. Retry only after the UI confirms no timer was started.
            time.sleep(.4); tree=ui(); control_point=point(tree,control)
            tap(control_point); time.sleep(.3); tree=ui()
            state=next(n for n in tree.iter('node') if n.get('resource-id')=='cases-state').get('text')
        assert 'pending='+pending_name in state, (owner,control,control_point,state)
        tap(point(tree,owner))
        before=inputs()[owner]
        assert before['focused'] and before['start']==before['end'], before
        time.sleep(4.2)
        after=inputs()[owner]; retained(before,after)
        changed=ui()
        state=next(n for n in changed.iter('node') if n.get('resource-id')=='cases-state').get('text')
        assert ('narrow=true' if control=='cases-resize' else 'busy=true') in state
        shot(owner+'-'+control)
        cases.append({'control':control,'state':state,'before':before,'after':after})
    # Pixel 8a's accessibility provider can stall while Gboard owns the
    # window. Keep the input focused, but hide the IME for this node lookup;
    # the rotation check below explicitly verifies the visible-keyboard path.
    dismiss_ime()
    stop_tree=ui()
    stop_nodes=[n for n in stop_tree.iter('node') if n.get('content-desc')=='Stop generating' and n.get('clickable')=='true']
    # GemieComposer is also present in this fixture; the tested Bloom owners
    # are the first two stop controls in the packaged tree.
    assert len(stop_nodes)>=2
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
    tap(point(ui(),owner));time.sleep(.3)
    rotation=rotate_and_check(owner)
    shot(owner+'-stop-and-type')
    results[owner]={'transitions':cases,'stop':{'before':before_stop,'after':after_stop,'state':state},'typed':typed,'rotation':rotation}
    # Restore idle/full width between owners without touching another application.
    adb('shell','input','keyevent','KEYCODE_BACK')
    tree=ui(); tap(point(tree,'cases-phase-reset')); time.sleep(.4)
    tree=ui(); state=next(n for n in tree.iter('node') if n.get('resource-id')=='cases-state').get('text')
    if 'narrow=true' in state:
        tap(point(tree,'cases-resize')); time.sleep(4.3)
(out/'report.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
adb('shell','am','force-stop',pkg)
