module.exports = {
  expo: {
    name: 'Bloom Material Lab',
    slug: 'bloom-material-lab',
    version: '1.0.0',
    scheme: 'bloom-material-lab',
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    updates: { enabled: false },
    android: { package: 'so.oxy.bloom.materiallab', permissions: [] },
    experiments: { reactCompiler: false },
    plugins: ['./without-network', './source-inputs', './path-probe', './with-hardware-light'],
  },
};
