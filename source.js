const cli = require('./lib/cli')

const options = {
  native: false,
  source: true,
  color: true
}

process.on('unhandledRejection', error => cli(error, options))
process.on('uncaughtException', error => cli(error, options))
