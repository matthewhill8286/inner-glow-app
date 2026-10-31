Pod::Spec.new do |s|
  s.name = 'InnerGlowAlarm'
  s.version = '1.0.0'
  s.summary = 'Inner Glow native wake-up alarms'
  s.description = 'Schedules system wake-up alarms through Apple AlarmKit.'
  s.license = 'MIT'
  s.author = 'Inner Glow'
  s.homepage = 'https://innerglowapp.com'
  s.platform = :ios, '15.1'
  s.swift_version = '5.9'
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.weak_frameworks = 'AlarmKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
