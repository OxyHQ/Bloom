# Usage: python3 summarize-atrace.py <atrace-or-text> <dedicated-test-process-id>
# Output omits process identifiers; nested spans overlap and must not be summed.
import re,collections,json,statistics,pathlib,sys,zlib
p=pathlib.Path(sys.argv[1]);test_pid=sys.argv[2];stacks=collections.defaultdict(list);spans=collections.defaultdict(list);threads={}
raw=p.read_bytes()
if b'TRACE:' in raw: raw=zlib.decompress(raw.split(b'TRACE:',1)[1].lstrip(b'\r\n'))
for line in raw.decode().splitlines():
 m=re.search(r'^\s*(.+?)-(\d+)\s+\(\s*(\d+)\).*?\s(\d+\.\d+): tracing_mark_write: (.*)$',line)
 if not m:continue
 thread,tid,pid,t,ev=m.groups();t=float(t);threads[tid]=thread
 if pid!=test_pid:continue
 if ev.startswith('B|'):stacks[tid].append((ev.split('|',2)[-1],t))
 elif ev.startswith('E') and stacks[tid]:
  name,start=stacks[tid].pop();spans[(thread,name)].append((t-start)*1000)
out=[]
for (thread,name),v in spans.items():
 if len(v)<2:continue
 out.append(dict(thread=thread,name=name,count=len(v),totalMs=sum(v),medianMs=statistics.median(v),p95Ms=sorted(v)[int(len(v)*.95)]))
out.sort(key=lambda x:x['totalMs'],reverse=True);print(json.dumps(out,indent=2))
