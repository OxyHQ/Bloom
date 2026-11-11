module.exports = {
  expo: {
    name: 'Bloom Panel Groups',
    slug: 'bloom-panel-groups',
    version: '1.0.0',
    orientation: 'default',
    newArchEnabled: true,
    updates: { enabled: false },
    android: { package: 'so.oxy.bloom.panelgroupslab', permissions: [] },
    experiments: { reactCompiler: false },
    plugins: ['./without-network'],
  },
};
