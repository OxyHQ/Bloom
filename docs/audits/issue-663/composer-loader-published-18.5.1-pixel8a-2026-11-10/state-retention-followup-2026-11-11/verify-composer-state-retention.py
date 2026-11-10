"""Track real Android composer inputs through packaged loader states on an authorized device."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

serial = os.environ["ANDROID_SERIAL"]
assert serial == os.environ["AUTHORIZED_PHYSICAL_SERIAL"]
adb_binary = os.environ["ADB"]
port = os.environ["ADB_PORT"]
base = [adb_binary, "-P", port, "-s", serial]
pkg = "so.oxy.bloom.loaderpackagelab"
out = Path(os.environ["OUT"]).resolve()
out.mkdir(parents=True, exist_ok=True)


def raw(*args):
    return subprocess.check_output(base + list(args), timeout=20)


def adb(*args):
    return raw(*args).decode().strip()


def foreground():
    state = adb("shell", "dumpsys", "activity", "activities")
    assert pkg in state and re.search(r"mResumedActivity|topResumedActivity|ResumedActivity:", state)


def ui():
    foreground()
    path = "/sdcard/bloom-composer-retention-663.xml"
    adb("shell", "rm", "-f", path)
    result = adb("shell", "uiautomator", "dump", path)
    assert "dumped to" in result, result
    return ET.fromstring(adb("shell", "cat", path))


def node(tree, resource_id):
    return next(
        item for item in tree.iter("node")
        if item.get("resource-id", "") in (resource_id, f"{pkg}:id/{resource_id}")
    )


def point(tree, resource_id):
    values = [int(value) for value in re.findall(r"\d+", node(tree, resource_id).get("bounds", ""))]
    left, top, right, bottom = values
    return (left + right) // 2, (top + bottom) // 2, bottom


def tap(resource_id):
    x, y, _ = point(ui(), resource_id)
    adb("shell", "input", "tap", str(x), str(y))


def screenshot(name):
    remote = f"/sdcard/bloom-composer-retention-{name}.png"
    adb("shell", "screencap", "-p", remote)
    destination = out / f"{name}.png"
    subprocess.run(base + ["pull", remote, str(destination)], check=True, timeout=20,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert destination.stat().st_size > 1024


def input_rows():
    foreground()
    pid = adb("shell", "pidof", pkg)
    def read_rows():
        return [
            json.loads(line.split("BloomInputProbe: ", 1)[1])
            for line in adb("logcat", "-d", "--pid=" + pid).splitlines()
            if "BloomInputProbe: {" in line
        ]
    old_count = len(read_rows())
    adb("shell", "am", "start", "-n", pkg + "/.MainActivity", "--es", "bloomProbe", "inputs")
    for _ in range(40):
        rows = read_rows()[old_count:]
        found = {row.get("testID"): row for row in rows if row.get("testID")}
        if {"cases-pill-input", "cases-agent-pill-input"} <= found.keys():
            return found
        time.sleep(0.1)
    raise AssertionError("native input probe did not report both Bloom composer owners")


def ime_visible():
    state = adb("shell", "dumpsys", "input_method")
    return bool(
        re.search(r"\bisShowing:\s*true\b|\bmInputShown\s*=\s*true\b", state, re.I)
        and re.search(r"\bmImeWindowVis=3\b", state)
    )


def assert_retained(before, after, label):
    for key in ("identity", "id", "text", "focused", "attached", "start", "end"):
        assert before[key] == after[key], {"checkpoint": label, "field": key, "before": before, "after": after}
    assert after["focused"] and after["attached"]


def phase_state():
    return node(ui(), "cases-state").get("text", "")


def verify_phase_cycle(owner, result, cycle):
    tap("cases-phase-reset")
    time.sleep(0.3)
    tap("cases-run-phases")
    started = time.monotonic()
    checkpoints = [
        (0.45, "submitting"), (3.45, "streaming"), (8.45, "stopping"),
        (11.45, "complete"), (13.45, "submitting"), (16.45, "streaming"),
        (21.45, "stopping"), (24.45, "complete"), (27.1, "idle"),
    ]
    observations = []
    typed = False
    for at, phase in checkpoints:
        time.sleep(max(0, at - (time.monotonic() - started)))
        current = input_rows()[owner]
        assert_retained(result, current, f"{cycle}:{phase} (scheduled)")
        typing = None
        if phase == "streaming" and cycle.endswith(":typing") and not typed:
            adb("shell", "input", "keyevent", "KEYCODE_DPAD_RIGHT")
            adb("shell", "input", "text", "Z")
            typing = input_rows()[owner]
            assert typing["text"] == current["text"] + "Z", {
                "checkpoint": f"{cycle}:{phase}:typing",
                "before": current,
                "after": typing,
            }
            assert typing["focused"] and typing["attached"]
            result.clear()
            result.update(typing)
            typed = True
        observations.append({
            "scheduledPhase": phase,
            "elapsedSeconds": round(time.monotonic() - started, 3),
            "input": current,
            "typingDuringStreaming": typing,
        })
    state = phase_state()
    assert "busy=false phase=idle" in state, {"cycle": cycle, "state": state}
    observations.append({"finalState": state, "input": input_rows()[owner]})
    result.clear()
    result.update(observations[-1]["input"])
    return observations


adb("shell", "am", "force-stop", pkg)
adb("shell", "am", "start", "-n", pkg + "/.MainActivity", "--es", "scene", "composers")
time.sleep(3)
ui()
report = {
    "deviceSerial": serial,
    "device": "Pixel 8a / Android 16 API 36",
    "scene": "published Bloom 18.5.1 ComposerCases",
    "owners": {},
}
for owner in ("cases-pill-input", "cases-agent-pill-input"):
    tree = ui()
    x, y, _ = point(tree, owner)
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(0.5)
    assert ime_visible(), "keyboard must be visible while probing retention"
    adb("shell", "input", "keycombination", "KEYCODE_CTRL_LEFT", "KEYCODE_A")
    selected = input_rows()[owner]
    assert selected["focused"] and selected["start"] == 0 and selected["end"] == len(selected["text"]), selected
    result = dict(selected)
    checkpoints = []

    for control, expected in (("cases-theme", None), ("cases-theme", None), ("cases-attachment", "attached=true")):
        tap(control)
        time.sleep(0.35)
        if expected:
            state = phase_state()
            assert expected in state, state
        after = input_rows()[owner]
        assert_retained(result, after, control)
        result = dict(after)
        checkpoints.append({"control": control, "input": after, "state": phase_state()})

    error_before = dict(result)
    tap("cases-phase-error")
    time.sleep(0.3)
    error = input_rows()[owner]
    assert "phase=error" in phase_state()
    assert_retained(error_before, error, "error")
    tap("cases-phase-reset")
    time.sleep(0.3)
    reset = input_rows()[owner]
    assert "phase=idle" in phase_state()
    assert_retained(error, reset, "error-reset")
    result = dict(reset)

    phase_observations = verify_phase_cycle(owner, result, owner + ":typing")
    checkpoints.extend({"control": "run-two-laps", **item} for item in phase_observations)
    report["owners"][owner] = {
        "selectedAtStart": selected,
        "checkpoints": checkpoints,
        "keyboardVisibleDuringPhaseCycle": ime_visible(),
        "phaseCycleSamples": len(phase_observations),
    }
    adb("shell", "input", "keyevent", "KEYCODE_BACK")
    time.sleep(0.3)
    if owner == "cases-pill-input":
        state = phase_state()
        if "attached=true" in state:
            tap("cases-attachment")
            time.sleep(0.3)

report["finalState"] = phase_state()
report["keyboardVisibleAtEnd"] = ime_visible()
(out / "retention-report.json").write_text(json.dumps(report, indent=2))
adb("shell", "input", "keyevent", "KEYCODE_BACK")
adb("shell", "am", "force-stop", pkg)
print(json.dumps(report, indent=2))
