const program = require('commander')

const log = console.log

program
	.version('1.0.0', '-v, --version')
	.arguments('<subreddit>')
	.action(function (subreddit) {
 		sub = subreddit
  	})
	.parse(process.argv)

if (typeof sub === 'undefined') sub = 'all'
log('subreddit:', sub);