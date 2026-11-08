module.exports = {
  expo: {
    name: 'Bloom Loader Package Lab',
    slug: 'bloom-loader-package-lab',
    version: '1.0.0',
    scheme: 'bloom-loader-package-lab',
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    updates: { enabled: false },
    android: { package: 'so.oxy.bloom.loaderpackagelab', permissions: [] },
    experiments: { reactCompiler: false },
    plugins: ['./without-network', './software-canvas-probe'],
  },
};
