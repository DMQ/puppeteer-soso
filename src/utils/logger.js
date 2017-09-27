var TimeFormat = require('./timeFormat')

function log(...args) {
	console.log(TimeFormat.format(), ...args)
}

module.exports = {log}