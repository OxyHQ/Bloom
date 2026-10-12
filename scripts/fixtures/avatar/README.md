# Independent geometry expectations

These are frozen semantic geometry and expected placements from the pre-cutover
observations. They replace test-time execution of the retired native engine.
No runtime, parser, worker, shader or old engine code is embedded here.

- `fitting.json.gz`: eight source meshes and cross-body eye/accessory placements.
- `contour.json.gz`: low/high input meshes, contours and SHA-256 values for every
  expected position, morph, normal and fur attribute.
- `clippo.json.gz`: low/high Clippo donor and target inputs plus independently
  constructed eye/brow positions, morphs and normals; the test pins the existing
  maximum Float32 residual of 2.4e-7.
- `circle-todd-placements.json`: observed transforms for the motion-retarget tests.

All values were captured before removing the executable; the migrated suites
passed 169 cases against these references. New art-directed proportions have
separate surface/attachment tests and a browser review gallery.
