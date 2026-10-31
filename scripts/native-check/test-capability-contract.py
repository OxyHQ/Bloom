"""Exercise the production Gradle contract; these projects do not model runtime APIs."""
import os
from pathlib import Path
import subprocess
import tempfile

validator = (Path(__file__).parent.parent.parent / "android/predictive-back-contract.gradle").resolve()
gradle = os.environ.get("BLOOM_TEST_GRADLE", "gradle")
cases = [
    ("default-without-screens", False, [], True, None),
    ("missing", True, [], False, "Found 0"),
    ("renamed-owner", True, [("arbitraryAutolinkName", "[apiVersion: 1, enabled: true].asImmutable()")], True, None),
    ("disabled", True, [("screens", "[apiVersion: 1, enabled: false]")], False, "enabled: true"),
    ("unsupported-version", True, [("screens", "[apiVersion: 2, enabled: true]")], False, "apiVersion: 1"),
    ("string-version", True, [("screens", "[apiVersion: '1', enabled: true]")], False, "apiVersion: 1"),
    ("string-enabled", True, [("screens", "[apiVersion: 1, enabled: 'true']")], False, "enabled: true"),
    ("malformed", True, [("screens", "'unsupported'")], False, "apiVersion: 1"),
    ("duplicate-with-malformed", True, [("first", "[apiVersion: 1, enabled: true]"), ("second", "null")], False, "Found 2"),
]
for name, enabled, publishers, success, error in cases:
    with tempfile.TemporaryDirectory(prefix=f"bloom-contract-{name}-") as directory:
        root = Path(directory)
        settings = "rootProject.name = 'capability-contract'\n"
        for project, value in publishers:
            settings += f"include ':{project}'\n"
            child = root / project
            child.mkdir()
            (child / "build.gradle").write_text(
                f"extensions.extraProperties.set('rnscreens.nativeBackOwnership', {value})\n"
            )
        (root / "settings.gradle").write_text(settings)
        (root / "build.gradle").write_text(f"apply from: '{validator.as_posix()}'\n")
        (root / "gradle.properties").write_text(
            "org.gradle.jvmargs=-Xmx512m -XX:ActiveProcessorCount=2\n"
        )
        result = subprocess.run(
            [gradle, "-p", str(root), f"-Pbloom.predictiveBackEnabled={str(enabled).lower()}",
             "help", "--console=plain", "--max-workers=1"],
            text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
        )
        if (result.returncode == 0) != success or (error and error not in result.stdout):
            raise SystemExit(f"{name} failed its contract assertion:\n{result.stdout}")
        print(f"PASS {name}", flush=True)
