const program = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const got = require('got')

const log = console.log
const subStyle = chalk.magentaBright
const postStyle = chalk.blue
const errorStyle = chalk.red

program
	.version('1.0.0', '-v, --version')
	.arguments('<subreddit>')
	.action(function (subreddit) {
 		sub = 'r/' + subreddit
  	})
	.parse(process.argv)

if (typeof sub === 'undefined') sub = 'r/all'

const spinner = ora('Opening ' + subStyle(sub)).start()

const display = (posts) => {
	log()
	posts.forEach( post => {
		log(postStyle(post.data.title))
	})
}

const showError = (error) => {
	log(errorStyle(error))
}

const load = async () => {
	try {
		const response = await got('reddit.com/' + sub + '.json', {json: true});
		if(!response.body.data.children.length) throw('This subreddit does not exist')
		else display(response.body.data.children)
		spinner.succeed()
	} catch (error) {
		spinner.fail(error)
	}
}

load()
