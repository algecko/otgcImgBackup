const fs = require('fs')
const {promisify} = require('util')
const path = require('path')

const writeAsync = promisify(fs.writeFile)
const readAsync = promisify(fs.readFile)

const LAST_FETCH_DATE_FILE_NAME = 'lastBackup'

getLastBackupDate = () => {
	return readAsync(path.join(__dirname, LAST_FETCH_DATE_FILE_NAME))
	.then(data => new Date(data.toString()))
}

module.exports.startBackup = async () => ({
	lastBackupDate: await getLastBackupDate(),
	backupFinished: backupFinished(new Date())
})

backupFinished = (finishedDate) => () => writeAsync(LAST_FETCH_DATE_FILE_NAME, finishedDate.toISOString(), 'utf8')