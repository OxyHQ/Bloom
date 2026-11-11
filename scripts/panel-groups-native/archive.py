"""Archive the APK and exact bundled source receipt, not a moving worktree snapshot."""
import hashlib
import json
import os
from pathlib import Path
import shutil

fixture = Path(__file__).resolve().parent
output = Path(os.environ["ARTIFACT_DIR"])
output.mkdir(parents=True, exist_ok=True)
sourcemap = json.loads((fixture / "android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map").read_text())


def sources(mapping):
    for section in mapping.get("sections", []):
        yield from sources(section["map"])
    yield from zip(mapping.get("sources", []), mapping.get("sourcesContent", []))


entries = list(sources(sourcemap))
receipt = next(json.loads(content) for path, content in entries if path == "/build.json")
(output / "embedded-build.json").write_text(json.dumps(receipt, indent=2) + "\n")
root = "/" + os.path.relpath(Path(receipt["sourceRoot"]) / "src", fixture) + "/"
hashes = {
    path.removeprefix(root): hashlib.sha256(content.encode()).hexdigest()
    for path, content in entries if path.startswith(root) and content is not None
}
assert hashes, "Sourcemap contains no selected Bloom source"
(output / "embedded-source-hashes.json").write_text(json.dumps(hashes, indent=2) + "\n")
apk = output / "app-release.apk"
shutil.copyfile(fixture / "android/app/build/outputs/apk/release/app-release.apk", apk)
(output / "apk.sha256").write_text(hashlib.sha256(apk.read_bytes()).hexdigest() + "  app-release.apk\n")
print(f"Archived {receipt['identity'][:8]} with {len(hashes)} source hashes to {output}")
