"""Kill the original target-tag eligibility regression using the actual opted host."""
import os
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[2]
host = root / 'android/src/predictive/java/so/oxy/bloom/PredictiveBackHost.kt'
original = host.read_text()
needle = '!registered || !previewEnabled || sessionKey.isEmpty() ||'
assert original.count(needle) == 1, 'Host eligibility changed; review the regression mutation'
suite = 'so.oxy.bloom.PredictiveBackHostEligibilityTest'
method = 'attachedHostConsumesBackBeforeDestinationReceivesANativeTag'
report = root / f'android/build/test-results/testDebugUnitTest/TEST-{suite}.xml'
command = [os.environ.get('BLOOM_TEST_GRADLE', 'gradle'), '-p', str(root / 'scripts/native-check'),
           '-Pbloom.predictiveBackEnabled=true', '-Prnscreens.nativeBackOwnershipEnabled=true',
           ':bloom:testDebugUnitTest', '--tests', f'{suite}.{method}', '--console=plain', '--max-workers=2']

def run():
    report.unlink(missing_ok=True)
    result = subprocess.run(command, cwd=root, check=False, timeout=600)
    assert report.exists(), 'No new test report: compilation/runtime failure is not a killed mutation'
    cases = ET.parse(report).getroot().findall('testcase')
    assert len(cases) == 1 and cases[0].get('name') == method, 'Expected exact production host regression test'
    return result.returncode, cases[0]

try:
    host.write_text(original.replace(needle, needle + ' destinationTag <= 0 ||'))
    code, case = run()
    failures = case.findall('failure')
    assert code != 0 and len(failures) == 1 and not case.findall('error'), 'Mutation survived or failed outside assertion'
    assert failures[0].get('type') == 'java.lang.AssertionError', 'Only the expected assertion kills this mutation'
    print('PASS: original target-tag guard is rejected by the actual host test', flush=True)
finally:
    host.write_text(original)

code, case = run()
assert code == 0 and not case.findall('failure') and not case.findall('error'), 'Restored production host must pass'
print('PASS: restored production host accepts an unresolved target', flush=True)
