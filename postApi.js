const fetch = require('node-fetch')
const winston = require('./logger')

const config = require('./config')

const QUERY_LIMIT = 50

const dateToRangeString = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

async function getPostsSince(refDate) {
	const rangeEnd = new Date()
	rangeEnd.setDate(rangeEnd.getDate() + 1)

	const dateRange = `${dateToRangeString(refDate)}-${dateToRangeString(rangeEnd)}`
	let after = null
	let posts = []
	let res
	do {
		if (res)
			after = res.data.reader.posts.pageInfo.endCursor
		res = await fetch(config.graphEndpoint, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `{
				reader{
					posts(dateRange:"${dateRange}" first:${QUERY_LIMIT} ${after ? `after:"${after}"` : ''}){
						pageInfo{
							hasNextPage
							endCursor
						}
						edges{
							node{
								id
								imgUrl
								text
							}
						}
					}
				}
			}`
			})
		})
			.then(res => res.json())


		posts = posts.concat(res.data.reader.posts.edges.map(edge => ({
			id: edge.node.id,
			imgUrl: edge.node.imgUrl,
			text: edge.node.text
		})))
	} while (res.data.reader.posts.pageInfo.hasNextPage)

	winston.log('info', `finished fetching ${posts.length} posts`)
	return posts
}

module.exports = { getPostsSince }