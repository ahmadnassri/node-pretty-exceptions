const pretty = require('./')

module.exports = (error, options) => {
  console.error()
  console.error(pretty(error, options))

  // Exit process with error:
  // https://github.com/nodejs/node-v0.x-archive/issues/2582
  // https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
  process.exit(1)
}
