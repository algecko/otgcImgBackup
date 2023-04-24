const Jimp = require('jimp')
const winston = require('./logger')

function scale(imgPath, targetPath, targetMaxWidth = 1024) {
	targetPath = `${targetPath.split('.')[0]}.jpg`

	winston.log('info', `Resizing  ${imgPath}`)

	return new Promise((resolve) => {
		Jimp.read(imgPath, function (err, img) {
			try {
				if (err)
					return console.error(err)
				if (img.bitmap.width > targetMaxWidth)
					img = img.resize(targetMaxWidth, Jimp.AUTO)
				img.quality(80)
				img.write(targetPath, (err) => {
					if (err)
						return resolve('error')
					resolve('done')
				})
			} catch (e) {
				resolve('error')
			}

		})
	})
}

module.exports = {scale}