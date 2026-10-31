if (process.env.EAS_BUILD_PLATFORM === 'ios' && process.env.EAS_BUILD_PROFILE === 'production')
  require('./check-submission.cjs');
