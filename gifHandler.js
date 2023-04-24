const util = require('util')
const winston = require('./logger')
const fs = require('fs')
const sizeOf = require('image-size')
const exec = util.promisify(require('child_process').exec)

const defaults = {
	compression: 80,
	maxWidth: undefined,
	size: 0
}

async function scale(imgPath, outputPath, options = defaults) {

	if (fs.existsSync(outputPath)) {
		winston.log('info', `${imgPath} Already exists`)
		return
	}
	winston.log('info', `Resizing ${imgPath} ${JSON.stringify(options)}`)

	let command = 'gifsicle -O3'
	command += ` --lossy=${options.compression || getCompressionBySize(options.size)}`
	command += ` -o ${outputPath}`

	const maxWidth = options.maxWidth || getMaxWidhtBySize(options.size)
	if (maxWidth) {
		const size = sizeOf(imgPath)
		if (size.width > maxWidth) {
			command += ` --resize-width ${maxWidth}`
		}
	}

	command += ` ${imgPath}`

	const {stderr} = await exec(command, {cwd: __dirname})
	if (stderr && stderr.length > 0)
		winston.log('error', stderr)
}

function getCompressionBySize(size) {
	const refSize = size > 20000000 ? 20000000 : size
	return Math.ceil(refSize / 133334) + 50
}

function getMaxWidhtBySize(size) {
	if (size > 50000000)
		return 320
	if (size > 10000000)
		return 480
	if (size > 5000000)
		return 640
	return
}

module.exports = {scale}