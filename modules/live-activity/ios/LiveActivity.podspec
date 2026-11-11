Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Starts and ends Inner Glow breathing Live Activities.'
  s.description    = 'A small Expo module around ActivityKit for the breathing Live Activity.'
  s.author         = 'Inner Glow'
  s.homepage       = 'https://github.com/matthewhill8286/inner-glow-app'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
