const cli = require('./lib/cli')

const options = {
  native: !!+process.env.PRETTY_EXCEPTIONS_NATIVE,
  source: !!+process.env.PRETTY_EXCEPTIONS_SOURCE,
  color: process.env.PRETTY_EXCEPTIONS_COLOR ? !!+process.env.PRETTY_EXCEPTIONS_COLOR : true
}

process.on('unhandledRejection', error => cli(error, options))
process.on('uncaughtException', error => cli(error, options))
