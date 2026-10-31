"""Check the actual library merger output preserves the RN 0.73 host SDK floor."""
from pathlib import Path
import xml.etree.ElementTree as ET

manifest = Path(__file__).parent / "build/bloom/intermediates/merged_manifest/debug/AndroidManifest.xml"
uses_sdk = ET.parse(manifest).getroot().find("uses-sdk")
actual = uses_sdk.attrib["{http://schemas.android.com/apk/res/android}minSdkVersion"]
if actual != "21":
    raise SystemExit(f"Default Bloom raised the host minSdkVersion from 21 to {actual}")
print("Default Bloom preserves the React Native 0.73 host minSdkVersion 21")
