import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireLabEmulator, requireOfflineApk } from './android-gate.mjs';
const devices = 'List of devices attached\nemulator-5580\tdevice\n';
test('accepts only the named isolated emulator', () => {
  requireLabEmulator('emulator-5580', devices, 'bloom_material_663\nOK', '1');
  assert.throws(() => requireLabEmulator('phone123', 'phone123 device', 'bloom_material_663', '1'));
  assert.throws(() => requireLabEmulator('emulator-5580', devices, 'my_existing_avd', '1'));
  assert.throws(() =>
    requireLabEmulator(
      'emulator-5580',
      devices.replace('device\n', 'offline\n'),
      'bloom_material_663',
      '1',
    ),
  );
  assert.throws(() => requireLabEmulator('emulator-5580', devices, 'bloom_material_663', '0'));
});
test('rejects networking and product application IDs before installation', () => {
  requireOfflineApk(
    'permission: android.permission.VIBRATE',
    "package: name='so.oxy.bloom.materiallab'",
  );
  assert.throws(() =>
    requireOfflineApk(
      'uses-permission: android.permission.INTERNET',
      "package: name='so.oxy.bloom.materiallab'",
    ),
  );
  assert.throws(() => requireOfflineApk('', "package: name='so.oxy.mention'"));
});
test('physical access requires exact explicit serial and cannot reuse another authorization', () => {
  requireLabEmulator('approved123', 'approved123\tdevice', '', '', 'approved123');
  assert.throws(() => requireLabEmulator('other456', 'other456\tdevice', '', '', 'approved123'));
  assert.throws(() =>
    requireLabEmulator('approved123', 'approved123\toffline', '', '', 'approved123'),
  );
});
