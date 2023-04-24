const infoTools = require('./backupInfoTools')
const winston = require('./logger')
const postApi = require('./postApi')
const postReader = require('./postReader')
const fetch = require('node-fetch')
const mime = require('mime')
const fs = require('fs')
const path = require('path')
const Queue = require('promise-queue')
const queue = new Queue(4, Infinity)
const {promisify} = require('util')

const readDir = promisify(fs.readdir)

async function startBackup() {
	const {lastBackupDate, backupFinished} = await infoTools.startBackup()
	const posts = await postApi.getPostsSince(lastBackupDate)

	await Promise.all(posts.map(postReader.getImagesFromPost).map(storePostImages))

	await backupFinished()
}

async function storePostImages(postImages) {
	let imgLoads = []

	if (postImages.images.postImg)
		imgLoads.push(queue.add(() => loadImage(postImages.images.postImg, postImages.post)))

	imgLoads = imgLoads.concat(postImages.images.inTextImg.directLinks.map((dl, index) => queue.add(() => loadImage(dl, `${postImages.post}_seq_${index}`))))
	imgLoads = imgLoads.concat(Object.keys(postImages.images.inTextImg.namedLinks).map(key => queue.add(() => loadImage(postImages.images.inTextImg.namedLinks[key], `${postImages.post}_${key}`))))

	await Promise.all(imgLoads)
}

function optimisticUrlFix(url) {
	return url.replace(/(http)?:?\/?\/$/, '')
}

function getExtension(theMimeType) {
	switch (theMimeType) {
		case 'image/jpg':
			return mime.getExtension('image/jpeg')
		default:
			return mime.getExtension(theMimeType)
	}
}

async function loadImage(url, fileName) {
	const destFolder = './rawImages/'

	const existing = (await readDir(destFolder)).find(fn => fn.startsWith(fileName))
	if (existing) {
		winston.log('info', `File ${fileName} already exists`)
		return
	}

	console.log(`start loading ${fileName}`)

	return fetch(optimisticUrlFix(url), {
		headers: {
			Accept: 'image/*',
			['Accept-Encoding']: 'gzip, defalte',
			['Accept-Language']: 'en-US,en,q0.5',
			['Cache-Control']: 'no-cache',
			Connection: 'keep-alive',
			Pragma: 'no-cache',
			['User-Agent']: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:60.0) Gecko/20100101 Firefox/60.0'
		}
	})
		.then(res => {
			if (res.status !== 200)
				throw `${res.status}: ${res.statusText}`

			const destPath = path.join(destFolder, `${fileName}.${getExtension(res.headers.get('content-type'))}`)
			if (fs.existsSync(destPath))
				return

			return new Promise((resolve, reject) => {
				const dest = fs.createWriteStream(destPath)
				res.body.pipe(dest)
				dest.on('finish', resolve)
				dest.on('error', reject)
			})
		})
		.then(() => console.log(`done loading ${fileName}`))
		.then(() => true)
		.catch(err => {
			console.error(err, url)
			return false
		})
}

module.exports = {startBackup}