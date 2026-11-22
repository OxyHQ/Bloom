# UNVERIFIED: never built (no Mac). Inert until react-native.config.js links iOS and
# package.json#files ships `ios` and this file; see ios/BloomAvatarSurface.swift.
require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'Bloom'
  s.version      = package['version']
  s.summary      = 'Native views of @oxy.so/bloom.'
  s.homepage     = 'https://github.com/OxyHQ/Bloom'
  s.license      = 'SEE LICENSE IN LICENSE'
  s.authors      = 'Oxy'
  s.platforms    = { :ios => '15.1' }
  s.source       = { :git => 'https://github.com/OxyHQ/Bloom.git', :tag => s.version.to_s }
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.swift_version = '5.9'
  install_modules_dependencies(s)
end
