function getImagesFromPost (post) {
	return {
		post: decodeId(post.id), images: {postImg: post.imgUrl, inTextImg: extractImages(post.text)}
	}
}

const decodeId = (id) => {
	const decoded = Buffer.from(id, 'base64').toString().toLowerCase()
	return decoded.startsWith('post') ? decoded.split(':')[1] : id
}

function extractImages (text) {
	const extractReffedImg = (imgKey) => {
		const matches = text.match(new RegExp(`\\[${imgKey}]:.*`, 'g'))
		if (matches) {
			const ref = matches[0]
			return ref.substring(ref.indexOf(':') + 1, ref.length).trim().split(' ')[0]
		}
	}

	const trimTrailingBracket = (text) => text.endsWith(')') ? text.substring(0, text.length - 1).trim() : text

	const postImgLinks = (text.match(/!\[.*]\(.*\)/g) || [])
	.map(item => trimTrailingBracket(item.substring(item.indexOf('(') + 1, item.length).trim().split(' ')[0]))

	const postImgRefs = {};

	(text.match(/!\[.*]\[.*]/g) || [])
	.map(item => item.substring(item.lastIndexOf('[') + 1, item.lastIndexOf(']')))
	.forEach(imgKey => {
		postImgRefs[imgKey] = trimTrailingBracket(extractReffedImg(imgKey))
	})

	return {
		directLinks: postImgLinks,
		namedLinks: postImgRefs
	}
}

module.exports = {getImagesFromPost}