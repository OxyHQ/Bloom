module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import so.oxy.bloom.BloomPackage;',
        packageInstance: 'new BloomPackage()',
      },
      ios: null,
    },
  },
};
