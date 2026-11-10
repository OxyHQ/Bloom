"""Capture two complete packaged composer phase cycles on one authorized device."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

serial = os.environ["ANDROID_SERIAL"]
assert serial == os.environ["AUTHORIZED_PHYSICAL_SERIAL"]
adb_base = [os.environ["ADB"], "-P", os.environ["ADB_PORT"], "-s", serial]
pkg = "so.oxy.bloom.loaderpackagelab"
out = Path(os.environ["OUT"]).resolve()
out.mkdir(parents=True, exist_ok=True)

def adb(*args):
    return subprocess.check_output(adb_base + list(args)).decode().strip()

def foreground():
    state = adb("shell", "dumpsys", "activity", "activities")
    assert pkg in state and re.search(r"mResumedActivity|topResumedActivity|ResumedActivity:", state)

def screenshot(name):
    foreground()
    (out / f"{name}.png").write_bytes(
        subprocess.check_output(adb_base + ["exec-out", "screencap", "-p"])
    )

def bounds(test_id):
    xml_path = "/sdcard/bloom-composer-phases.xml"
    adb("shell", "uiautomator", "dump", xml_path)
    root = ET.fromstring(adb("shell", "cat", xml_path))
    node = next(
        item for item in root.iter("node")
        if item.get("resource-id", "").endswith("/" + test_id)
        or item.get("resource-id", "") == test_id
    )
    values = [int(value) for value in re.findall(r"\d+", node.get("bounds", ""))]
    return values

def tap(test_id):
    x, y, right, bottom = bounds(test_id)
    adb("shell", "input", "tap", str((x + right) // 2), str((y + bottom) // 2))

foreground()
record = subprocess.Popen(
    adb_base + ["shell", "screenrecord", "--time-limit", "34", "/sdcard/composer-phases.mp4"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(1)
started = time.monotonic()
tap("cases-run-phases")
started = time.monotonic()
timeline = []

def phase(name, at):
    time.sleep(max(0, at - (time.monotonic() - started)))
    elapsed = round(time.monotonic() - started, 3)
    screenshot(name)
    timeline.append({"checkpoint": name, "elapsedSeconds": elapsed})

phase("lap1-submitting", 0.05)
phase("lap1-streaming", 3.2)
phase("lap1-stopping", 8.2)
phase("lap1-complete", 11.2)
phase("lap2-submitting", 13.2)
phase("lap2-streaming", 16.2)
phase("lap2-stopping", 21.2)
phase("lap2-complete", 24.2)
phase("idle", 27.2)

foreground()
xml_path = "/sdcard/bloom-composer-phases.xml"
assert "dumped to" in adb("shell", "uiautomator", "dump", xml_path)
root = ET.fromstring(adb("shell", "cat", xml_path))
state = next(
    item.get("text", "") for item in root.iter("node")
    if item.get("resource-id", "").endswith("/cases-state")
    or item.get("resource-id", "") == "cases-state"
)
assert "busy=false" in state and "phase=idle" in state, state
while record.poll() is None:
    time.sleep(0.25)
assert record.returncode == 0, f"screenrecord exited {record.returncode}"
adb("pull", "/sdcard/composer-phases.mp4", str(out / "two-laps.mp4"))
(out / "phase-timeline.json").write_text(json.dumps({"stateAfter": state, "timeline": timeline}, indent=2))
adb("shell", "am", "force-stop", pkg)
print(json.dumps({"stateAfter": state, "timeline": timeline, "video": str(out / "two-laps.mp4")}))
