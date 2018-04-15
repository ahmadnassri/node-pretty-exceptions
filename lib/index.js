const { format } = require('util')
const { readFileSync } = require('fs')
const { relative } = require('path')
const chalk = require('chalk')
const ErrorStackParser = require('error-stack-parser')
const strip = require('strip-ansi')

module.exports = (error, opts) => {
  const output = []
  const options = Object.assign({
    native: false,
    source: false,
    color: false,
    cwd: process.cwd()
  }, opts)

  // detect errors
  const isError = Object.prototype.toString.call(error) === '[object Error]' || error instanceof Error

  // exit early
  if (!isError) {
    return error
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
    (grouped[frame.fileName] = grouped[frame.fileName] || []).push(frame)
    return grouped
  }, {})

  // opening line
  output.push(chalk`{white.bold.bgRed ${error.constructor.name}}{magenta :} ${error.message}`)

  // display all error properties
  for (let property in error) {
    if (property === 'stack') continue
    output.push(chalk` {gray ├─╼} {red ${property}}: ${error[property]}`)
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
      meta.source = readFileSync(filename)
    } catch (err) {
      if (err.errno === -2) meta.native = true
    }

    Object.assign(grouped[filename], meta)
  })

  if (!options.native) {
    filenames = filenames.filter(filename => !grouped[filename].native)
  }

  // loop through files
  filenames.forEach((filename, x) => {
    const frames = grouped[filename]

    const lastFile = x + 1 >= filenames.length

    const PREFIX = lastFile ? ' ' : ' │'

    let lines = frames.source ? frames.source.toString().split(/\n|\r\n/) : false

    output.push(chalk` {gray │}`)

    // call stack frame
    output.push(chalk` {gray ${lastFile ? '└┬╼' : '├─┬╼'}} {green ${relative(options.cwd, filename)}}`)

    // spacer
    output.push(chalk.gray(PREFIX + ' │'))

    // loop through each frame
    frames.forEach((frame, n) => {
      const lastFrame = n + 1 >= frames.length

      const symbol = (lastFrame && !options.source) || (lastFrame && frames.native) ? '└──╼' : '├──╼'

      // frame details
      const lineDetails = chalk.blue.italic(frame.lineNumber) + (!options.source ? chalk.gray.italic(':') + chalk.cyan.italic(frame.columnNumber) : '')
      output.push(chalk`{gray ${PREFIX} ${symbol}} {yellow ${frame.functionName}} {gray.italic @ line} ${lineDetails}`)

      if (options.source && lines) {
        const line = lines[frame.lineNumber - 1]
        const before = lines[frame.lineNumber - 2]
        const after = lines[frame.lineNumber]

        let whiteSpaceBefore = line.search(/\S|$/)

        let preview = [before, line, after]

        // spacer
        output.push(chalk.gray(PREFIX + ' │'))

        preview.forEach((item, y) => {
          if (item && item.trim() !== '') {
            if (item === line) {
              output.push(chalk.gray(format(`${PREFIX} ${lastFrame ? '└' : '├'}╌╌╌%s╮`, '╌'.repeat(frame.columnNumber - whiteSpaceBefore))))
            }

            output.push(chalk.gray(`${PREFIX} ${lastFrame && item !== before ? ' ' : '│'}    ${item.trim()}`))
          }

          if (y + 1 >= preview.length) {
            output.push(chalk.gray(`${PREFIX} ${lastFrame ? '' : '│'}`))
          }
        })
      }
    })
  })

  return options.color ? output.join('\n') : strip(output.join('\n'))
}
