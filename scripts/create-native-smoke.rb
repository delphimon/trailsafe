# Run with CocoaPods' Ruby environment; creates a throwaway UI-test runner, not app source.
require 'xcodeproj'
require 'fileutils'
root = '/private/tmp/trailsafe-native-smoke'
FileUtils.mkdir_p(root)
project = Xcodeproj::Project.new(File.join(root, 'TrailSafeSmoke.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'TrailSafeSmoke', :ios, '16.4')
file = project.main_group.new_file(File.expand_path('../tests/native/TrailSafeSmoke.swift', __dir__))
target.source_build_phase.add_file_reference(file)
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.appliedinteractions.trailsafe.smoke'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path, 'TrailSafeSmoke')
puts project.path
