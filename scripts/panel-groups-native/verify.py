"""Exercise the isolated production-renderer fixture on an authorized Android device."""

import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

serial = os.environ["ANDROID_SERIAL"]
output = Path(os.environ.get("ARTIFACT_DIR", ".local/panel-groups-native"))
output.mkdir(parents=True, exist_ok=True)
identity = json.loads(Path(__file__).with_name("build.json").read_text())["identity"][:8]
package = "so.oxy.bloom.panelgroupslab"


def adb(*arguments):
    return subprocess.check_output(["adb", "-s", serial, *arguments])


def capture(name):
    adb("shell", "uiautomator", "dump", "/sdcard/panel-groups-ui.xml")
    data = adb("shell", "cat", "/sdcard/panel-groups-ui.xml")
    tree = ET.fromstring(data)
    assert any(node.get("package") == package for node in tree.iter("node")), (
        "Fixture is no longer foregrounded"
    )
    (output / f"{name}.xml").write_bytes(data)
    (output / f"{name}.png").write_bytes(adb("exec-out", "screencap", "-p"))
    return tree


def find(tree, identifier):
    return next(node for node in tree.iter("node") if node.get("resource-id") == identifier)


def bounds(node):
    return list(map(int, re.findall(r"\d+", node.get("bounds"))))


def tap(tree, identifier):
    left, top, right, bottom = bounds(find(tree, identifier))
    adb("shell", "input", "tap", str((left + right) // 2), str((top + bottom) // 2))


def rows(tree, prefix):
    return [
        node.get("text")
        for node in tree.iter("node")
        if node.get("text", "").startswith(prefix + " row")
        and bounds(node)[3] > bounds(node)[1]
    ]


report = {}
adb("shell", "am", "force-stop", package)
adb("shell", "am", "start", "-n", package + "/.MainActivity")
time.sleep(2)
current = capture("native-initial")
assert any(node.get("text") == "Panels " + identity for node in current.iter("node"))
screen = bounds(next(current.iter("node")))
center = str((screen[0] + screen[2]) // 2)
height = screen[3]
density = int(re.findall(r"\d+", adb("shell", "wm", "density").decode())[-1]) / 160

# The workspace already owns the notch inset; nested panel headers add only their row.
header = bounds(find(current, "native-Post-header"))
assert abs(header[3] - header[1] - 56 * density) < 3, "Nested header duplicates the safe-area inset"
report["nestedHeaderOwnsNoDuplicateInset"] = True

tap(current, "native-open")
current = capture("native-split")
report["split"] = {
    identifier: bounds(find(current, identifier))
    for identifier in ["native-post-panel", "native-likes-panel"]
}
post = report["split"]["native-post-panel"]
likes = report["split"]["native-likes-panel"]
assert post[3] <= likes[1] and likes[3] > likes[1]
assert abs((post[3] - post[1]) - (likes[3] - likes[1])) < 5
for target in [post[1] + 20, likes[3] - 250, post[3]]:
    grip = bounds(find(current, "native-post-panel-divider"))
    adb("shell", "input", "swipe", center, str((grip[1] + grip[3]) // 2), center, str(target), "500")
    current = capture("native-resized-" + str(target))
    resized_post = bounds(find(current, "native-post-panel"))
    resized_likes = bounds(find(current, "native-likes-panel"))
    assert resized_post[3] - resized_post[1] >= 120 * density - 3
    assert resized_likes[3] - resized_likes[1] >= 120 * density - 3
report["nativeResizeMinimums"] = True
post = bounds(find(current, "native-post-panel"))
likes = bounds(find(current, "native-likes-panel"))
post_before = rows(current, "Post")
likes_before = rows(current, "Likes")
adb("shell", "input", "swipe", center, str(post[3] - 50), center, str(post[1] + 250), "450")
current = capture("native-post-scrolled")
assert rows(current, "Post") != post_before
assert rows(current, "Likes") == likes_before
post_after = rows(current, "Post")
# Stay clear of Android's bottom navigation gesture area.
adb("shell", "input", "swipe", center, str(likes[3] - 250), center, str(likes[1] + 250), "450")
current = capture("native-likes-scrolled")
assert rows(current, "Post") == post_after
assert rows(current, "Likes") != likes_before
report["independentNativeScroll"] = True

tap(current, "native-open")
current = capture("native-closed")
assert not rows(current, "Likes")
assert rows(current, "Post")[0] == post_after[0]
report["closeRetainsReadingPosition"] = True
assert find(current, "native-open").get("content-desc") == "Split; completed exits 1"
report["inlineExitCompletion"] = True

tap(current, "native-sheet")
current = capture("native-sheet")
sheet = bounds(find(current, "native-likes-panel-floating"))
assert sheet[1] >= height * 0.1 - 2 and sheet[3] - sheet[1] <= height * 0.9 + 2
sheet_header = bounds(find(current, "native-Likes-header"))
assert abs(sheet_header[3] - sheet_header[1] - 56 * density) < 3, "Floating header duplicates the safe-area inset"
report["floatingHeaderOwnsNoDuplicateInset"] = True
report["sheetBounds"] = sheet
report["sheetMaxHeightRatio"] = 0.9
assert rows(current, "Likes")
adb("shell", "input", "keyevent", "4")
current = capture("native-sheet-closed")
assert not rows(current, "Likes")
report["nativeSheetAndBackDismiss"] = True
assert find(current, "native-open").get("content-desc") == "Split; completed exits 2"
report["sheetExitCompletion"] = True

tap(current, "native-flow")
current = capture("native-flow")
report["flowInitial"] = [node.get("text") for node in current.iter("node") if node.get("text", "").startswith("Email ")]
adb("shell", "input", "swipe", center, str(round(height * 0.85)), center, str(round(height * 0.3)), "500")
current = capture("native-flow-scrolled")
report["flowScrolled"] = [node.get("text") for node in current.iter("node") if node.get("text", "").startswith("Email ")]
assert report["flowInitial"] != report["flowScrolled"]
tap(current, "native-add")
adb("shell", "input", "swipe", center, str(round(height * 0.85)), center, str(round(height * 0.3)), "500")
current = capture("native-flow-added")
assert any(node.get("text") == "Email 4" for node in current.iter("node"))
report["nativeFlowAddsScrollContent"] = True
# A fresh session verifies the default split is unchanged by the interaction cap.
adb("shell", "am", "force-stop", package)
adb("shell", "am", "start", "-n", package + "/.MainActivity")
time.sleep(2)
current = capture("native-cap-initial")
tap(current, "native-add")  # three real rows; no panel dimensions are authored by the fixture.
tap(current, "native-open")
current = capture("native-cap-split")
initial_post = bounds(find(current, "native-post-panel"))
initial_likes = bounds(find(current, "native-likes-panel"))
initial_height = initial_likes[3] - initial_likes[1]
assert abs(initial_height - (initial_post[3] - initial_post[1])) < 5
for direction in ["grow", "shrink", "grow-to-content"]:
    grip = bounds(find(current, "native-post-panel-divider"))
    start_y = (grip[1] + grip[3]) // 2
    target_y = initial_post[1] + 10 if direction != "shrink" else initial_likes[3] - 20
    adb("shell", "input", "swipe", center, str(start_y), center, str(target_y), "500")
    current = capture("native-cap-" + direction)
    panel = bounds(find(current, "native-likes-panel"))
    actual = panel[3] - panel[1]
    if direction == "grow":
        assert abs(actual - initial_height) < 5, "Oversized pane grew beyond its initial size"
    elif direction == "shrink":
        assert abs(actual - 120 * density) < 5, "Minimum must remain usable"
    else:
        assert 120 * density < actual < initial_height - 30, "Intrinsic content did not cap growth"
        assert all(f"Likes row {number}" in rows(current, "Likes") for number in [1, 2, 3])
        report["nativeContentResizeCap"] = {"initial": initial_height, "capped": actual}
(output / "native-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
