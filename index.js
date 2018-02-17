'use strict'

const chalk = require('chalk')
const ErrorStackParser = require('error-stack-parser')
const fs = require('fs')
const util = require('util')

const showNative = process.env.PRETTY_EXCEPTIONS_NATIVE === 'true'
const showSource = process.env.PRETTY_EXCEPTIONS_SOURCE === 'true'

process.on('unhandledRejection', handler)
process.on('uncaughtException', handler)

function handler (error) {
  // detect errors
  const isError = Object.prototype.toString.call(error) === '[object Error]' || error instanceof Error

  // exit early
  if (!isError) {
    return console.error(error)
  }

  // parse the stack trace (if any)
  const trace = ErrorStackParser.parse(error)

  // no trace given for top-level
  const initial = error.stack.split('\n').shift().split(':')

  trace.unshift({
    lineNumber: initial[1],
    fileName: initial[0],
    functionName: '<root>'
  })

  // group by filename
  const grouped = trace.reduce((grouped, frame) => {
    (grouped[frame.fileName] = grouped[frame.fileName] || []).push(frame);
    return grouped
  }, {})

  // opening line
  console.error()
  console.error('%s%s %s', chalk.bold.white.bgRed(error.constructor.name), chalk.magenta(':'), error.message)

  // display all error properties
  for (let property in error) {
    if (property === 'stack') continue
    console.error(' %s %s: %j', chalk.gray('├─╼'), chalk.red(property), error[property])
  }

  let filenames = Object.keys(grouped)

  // detect native / readable files
  filenames.forEach(filename => {
    let meta = {
      source: false,
      native: false
    }

    // read file content
    try {
      meta.source = fs.readFileSync(filename)
    } catch (err) {
      if (err.errno === -2) meta.native = true
    }

    Object.assign(grouped[filename], meta)
  })

  if (!showNative) {
    filenames = filenames.filter(filename => !grouped[filename].native)
  }

  // loop through files
  filenames.forEach((filename, x) => {
    const frames = grouped[filename]

    const lastFile = x + 1 >= filenames.length

    const PREFIX = lastFile ? ' ' : ' │'

    let lines = frames.source ? frames.source.toString().split(/\n|\r\n/) : false

    console.error(chalk.gray(' │'))

    // call stack frame
    console.error(' %s %s', chalk.gray(lastFile ? '└┬╼' : '├─┬╼'), chalk.green(filename))

    // spacer
    console.error(chalk.gray(PREFIX + ' │'))

    // loop through each frame
    frames.forEach((frame, n) => {
      const lastFrame = n + 1 >= frames.length

      const symbol = (lastFrame && !showSource) || (lastFrame && frames.native) ? '└──╼' : '├──╼'

      // frame details
      const lineDetails = chalk.blue.italic(frame.lineNumber) + (!showSource ? chalk.gray.italic(':') + chalk.cyan.italic(frame.columnNumber) : '')
      console.error('%s %s %s%s', chalk.gray(`${PREFIX} ${symbol}`), chalk.yellow(frame.functionName), chalk.gray.italic('@ line '), lineDetails)

      if (showSource && lines) {
        const line = lines[frame.lineNumber - 1]
        const before = lines[frame.lineNumber - 2]
        const after = lines[frame.lineNumber]

        let whiteSpaceBefore = line.search(/\S|$/)

        let preview = [before, line, after]

        // spacer
        console.error(chalk.gray(PREFIX + ' │'))

        preview.forEach((item, y) => {
          if (item && item.trim() !== '') {

            if (item === line) {
              console.error(chalk.gray(util.format(`${PREFIX} ${lastFrame ? '└' : '├'}╌╌╌%s╮`, '╌'.repeat(frame.columnNumber - whiteSpaceBefore))))
            }

            console.error(chalk.gray(`${PREFIX} ${lastFrame && item !== before ?  ' ' : '│'}    ${item.trim()}`))
          }

          if (y + 1 >= preview.length) {
            console.error(chalk.gray(`${PREFIX} ${lastFrame ? '' : '│'}`))
          }
        })

      }
    })
  })

  // empty line
  console.error()

  // https://github.com/nodejs/node-v0.x-archive/issues/2582
  // https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
  process.exit(1)
}
