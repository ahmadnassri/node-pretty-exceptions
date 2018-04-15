const cli = require('./lib/cli')

const options = {
  native: true,
  source: false,
  color: true
}

process.on('unhandledRejection', error => cli(error, options))
process.on('uncaughtException', error => cli(error, options))
