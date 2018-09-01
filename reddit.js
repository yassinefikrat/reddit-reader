const program = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const boxen = require('boxen')
const got = require('got')
const inquirer = require('inquirer')


const log = console.log
const subStyle = chalk.magentaBright
const postStyle = chalk.blue
const errorStyle = chalk.red

let sort = 'hot'

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
	posts.forEach( (post, index) => {
		log(postStyle(post.data.title))
	})
}

const showError = (error) => {
	log(errorStyle(error))
}

const load = async () => {
	try {
		let params = ''
		if(sort==='top') params = '?t=all'
		const response = await got(
			'reddit.com/' + sub + '/' + sort + '.json' + params,
			{json: true}
		);
		if(!response.body.data.children.length) throw('This subreddit does not exist')
		else display(response.body.data.children)
		spinner.succeed(response.body.data.children.length + ' posts loaded')
	} catch (error) {
		spinner.fail(error)
	}
}

const iteration = () => {
	load().then(() => {
		inquirer
			.prompt([
				{
				    type: 'list',
				    name: 'command',
				    message: 'What next?',
    				choices: ['Next page', 'Other subreddit', 'Sort by ' + ((sort==='hot')?'Top All Time':'Hot')],
			  	}
			])
			.then(answer => {
				log(answer.command)
				switch(answer.command) {
					case 'Next page':
						log('pls')
						break
					case 'Other subreddit':
						log('new iteration')
						break
					case 'Sort by Top All Time':
						sort = 'top'
						break
					case 'Sort by Hot':
						sort = 'hot'
						break
					default:
						log('default')
				}
				iteration()
			})
	})
}

iteration()
	


