const imgBackup = require('./imgBackup')

imgBackup.startBackup()
.then(res => {
	console.log(res || 'done')
	process.exit()
})
.catch(console.error)