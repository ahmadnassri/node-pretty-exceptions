'use strict'

const chalk = require('chalk')
const ErrorStackParser = require('error-stack-parser')
const fs = require('fs')
const util = require('util')

const showNative = process.env.PRETTY_EXCEPTIONS_NATIVE === 'true'
const showSource = process.env.PRETTY_EXCEPTIONS_SOURCE === 'true'

process.on('uncaughtException', function (error) {
  // detect errors
  const isError = Object.prototype.toString.call(error) === '[object Error]' || error instanceof Error

  // exit early
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

  let filenames = Object.keys(grouped)

  // detect native / readable files
  filenames.forEach(filename => {
    let stats = {
      accessable: false,
      native: false
    }

    try {
      stats.accessable = fs.accessSync(filename, fs.constants.F_OK | fs.constants.R_OK)
    } catch (err) {
      // file inaccessable, likely native
      stats.native = true
    }

    Object.assign(grouped[filename], stats)
  })

  if (!showNative) {
    filenames = filenames.filter(filename => !grouped[filename].native)
  }

  // loop through files
  filenames.forEach((filename, x) => {
    const frames = grouped[filename]

    const lastFile = x + 1 >= filenames.length

    const PREFIX = lastFile ? ' ' : ' │'

    let lines = false

    console.error(chalk.gray(' │'))

    if (frames.accessable !== false) {
      // read file content
      lines = fs.readFileSync(filename).toString().split(/\n|\r\n/)
    }

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
          if (item.trim() !== '') {

            if (item === line) {
              console.error(chalk.gray(util.format(`${PREFIX} ${lastFrame ? '└' : '├'}╌╌╌%s╮`, '╌'.repeat(frame.columnNumber - whiteSpaceBefore))))
            }

            console.error(chalk.gray(`${PREFIX} ${lastFrame ? ' ' : '│'}    ${item.trim()}`))
          }

          if (y + 1 >= preview.length) {
            console.error(chalk.gray(`${PREFIX} ${lastFrame ? '' : '│'}`))
          }
        })

      }
    })
  })

  console.error()
})
