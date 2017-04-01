const chalk = require('chalk')
const ErrorStackParser = require('error-stack-parser')
const util = require('util')

process.on('uncaughtException', function (error) {
  const isError = Object.prototype.toString.call(error) === '[object Error]' || error instanceof Error

  if (!isError) {
    return console.error(error)
  }

  // parse the stack trace (if any)
  const trace = ErrorStackParser.parse(error)

  // group by filename
  const grouped = trace.reduce((grouped, frame) => {
    (grouped[frame.fileName] = grouped[frame.fileName] || []).push(frame);
    return grouped
  }, {})

  // opening line
  console.error()
  console.error('%s%s %s', chalk.bold.white.bgRed(error.constructor.name), chalk.magenta(':'), error.message)

  const files = Object.keys(grouped)

  // loop through files
  files.forEach((file, x) => {

    console.error(chalk.gray(' │'))
    const symbol = x < files.length - 1 ? ' ├' : ' └'
    const connector = x === files.length - 1 ? ' ' : ' │'

    console.error('%s %s', chalk.gray(symbol + '─'), chalk.green(file))
    console.error('%s   %s', chalk.gray(connector), chalk.gray('│'))

    const frames = grouped[file]
    frames.forEach((frame, n) => {
      const symbol = n < frames.length - 1 ? '├' : '└'

      console.error('%s   %s %s %s %s %s %s', chalk.gray(connector), chalk.gray(symbol + '─'), chalk.gray('line:'), chalk.blue(frame.lineNumber), chalk.gray('col:'), chalk.cyan(frame.columnNumber), chalk.yellow(frame.functionName))
    })
  })

  console.error()
})
