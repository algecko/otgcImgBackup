const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const Queue = require('promise-queue')
const winston = require('./logger')
const queue = new Queue(4, Infinity)


const readDirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)

const gifHandler = require('./gifHandler')
const imgHandler = require('./imgHandler')

const inputFolder = path.join(__dirname, './rawImages')
const outputFolder = path.join(__dirname, './scaled')

const enhBasename = (thPath) => path.basename(thPath).replace(/\.(jpeg|png)/gi, ".jpg")

scaleImages()
	.then(res => {
		winston.log('info', res || 'done')
		process.exit()
	})
	.catch(err => winston.log('error', err))

async function getStats() {
	const files = await readDirAsync(inputFolder)
	const existingFiles = await readDirAsync(outputFolder)

	const fileStats =
		await Promise.all(
			files.map(file => path.join(inputFolder, file))
				.map(filePath => statAsync(filePath).then(stat => ({
					path: filePath,
					size: stat.size,
					ext: path.extname(filePath)
				}))))

	return fileStats
		.filter(stat => (stat.ext || '').length > 0)
		.filter(stat => !existingFiles.includes(enhBasename(stat.path)))
		.sort((a, b) => b.size - a.size)
}

async function scaleImages() {
	const stats = await getStats()

	winston.log("info", `resizing ${stats.length} images`)

	return Promise.all(stats.map(stat => queue.add(() => scaleImageInFile(stat))))
}

function scaleImageInFile(fileStat) {
	const outputPath = path.join(outputFolder, path.basename(fileStat.path))

	if (fileStat.ext === '.gif')
		return gifHandler.scale(fileStat.path, outputPath, {size: fileStat.size})

	return imgHandler.scale(fileStat.path, outputPath)
}