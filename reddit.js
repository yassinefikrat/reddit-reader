const program = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const boxen = require("boxen");
const got = require("got");
const inquirer = require("inquirer");
const terminalImage = require("terminal-image");

inquirer.registerPrompt("autosubmit", require("inquirer-autosubmit-prompt"));

const log = console.log;
const clear = console.clear;
const subStyle = chalk.magentaBright;
const postStyle = chalk.blue;
const numberStyle = chalk.bold;
const errorStyle = chalk.red;

let sort = "hot";
let afterOrBefore = "";
let firstPost = "";
let lastPost = "";
let browsing = false;
let currentPost = {};
let currentUrl = "";

program
	.version("1.0.0", "-v, --version")
	.arguments("<subreddit>")
	.action(function(subreddit) {
		sub = "r/" + subreddit;
	})
	.parse(process.argv);

if (typeof sub === "undefined") sub = "r/all";

const display = posts => {
	clear();
	posts.forEach((post, index) => {
		log(numberStyle(index + 1) + ": " + postStyle(post.data.title));
	});
	log();
	firstPost = posts[0].data.id;
	lastPost = posts[posts.length - 1].data.id;
};

const displayPost = async post => {
	clear();
	log(postStyle(post.data.title));
	const wrappedText = wrap(post.data.selftext, 100);
	log(wrappedText);
	log();
};

const displayImage = async (url, force) => {
	if(force || (/\.(gif|jpg|jpeg|tiff|png)$/i).test(url)) {
		const { body } = await got(url, { encoding: null });
		log(await terminalImage.buffer(body));
	} else {
		log("Doesn't look like "+url+" is an image. Enter 'if' to force.")
	}
};

const titleOfPost = post => (post.data.title ? post.data.title : "");

const showError = error => {
	log(errorStyle(error));
};

const load = async () => {
	const spinner = ora("Opening " + subStyle(sub)).start();
	try {
		let params = "";
		if (sort === "top") params = "?t=all";
		if (afterOrBefore) {
			if (params === "") params = "?" + afterOrBefore;
			else params += "&" + afterOrBefore;
		}
		const response = await got(
			"reddit.com/" + sub + "/" + sort + ".json" + params,
			{ json: true }
		);
		if (!response.body.data.children.length)
			throw "This subreddit does not exist";
		else {
			spinner.succeed(
				response.body.data.children.length + " posts loaded"
			);
			return response.body.data.children;
		}
	} catch (error) {
		spinner.fail(error);
	}
};

// pls

const iteration = () => {
	load().then(async posts => {
		if (!browsing) {
			await display(posts);
			inquirer
				.prompt([
					{
						type: "list",
						name: "command",
						message: "What next?",
						choices: [
							"Next page",
							"Previous page",
							"Browse",
							"Other subreddit",
							"Sort by " +
								(sort === "hot" ? "Top All Time" : "Hot")
						]
					}
				])
				.then(async answer => {
					switch (answer.command) {
						case "Next page":
							afterOrBefore = "after=t3_" + lastPost;
							break;
						case "Previous page":
							afterOrBefore = "before=t3_" + firstPost;
							break;
						case "Browse":
							browsing = true;
							break;
						case "Other subreddit":
							await inquirer
								.prompt({
									name: "chosenSub",
									message:
										"Which subreddit would you like to visit next ?"
								})
								.then(answer => {
									sub = "r/" + answer.chosenSub;
								});
							break;
						case "Sort by Top All Time":
							sort = "top";
							afterOrBefore = "";
							break;
						case "Sort by Hot":
							sort = "hot";
							afterOrBefore = "";
							break;
						default:
							log("default");
					}
					iteration();
				});
		} else {
			await display(posts);
			inquirer
				.prompt({
					type: "input",
					name: "chosenPostIndex",
					message: "Choose a post to display"
				})
				.then(async answer => {
					let i = Number(await answer.chosenPostIndex);
					if (i != undefined && i > 0 && i <= posts.length) {
						await displayPost(posts[i - 1]); // So post numbers start at 1.
						promptAtPostLevel(posts[i - 1]);
					} else {
						browsing = false;
						iteration();
					}
				});
		}
	});
};

const promptAtPostLevel = post => {
	inquirer
		.prompt({
			type: "autosubmit",
			name: "char",
			message: "i to display image, b to go back"
		})
		.then(async answer => {
			switch (answer.char) {
				case "i":
					await displayImage(post.data.url, false);
					promptAtPostLevel(post);
					break;
				case "if":
					await displayImage(post.data.url, true);
					promptAtPostLevel(post);
					break;
				case "b":
					iteration();
					break;
				default:
					await displayPost(post);
					promptAtPostLevel(post);
					break;
			}
		});
};

const promptForSub = () => {
	const options = {
		name: "chosenSub",
		message: "Which subreddit would you like to visit next ?"
	};

	return inquirer.prompt(options);
};

const wrap = (s, w) =>
	s.replace(
		new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"),
		"$1\n"
	);

iteration();
