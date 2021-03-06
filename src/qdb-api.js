const http = require('http');
const cheerio = require('cheerio');

function get(options) {
	return new Promise((resolve, reject) => {
		try {
			http.get(options, (response) => {
				let data = '';
				response.setEncoding('ascii');
				response.on('data', (chunk) => {data += chunk});
				response.on('end', () => {
					resolve(data);
				});
			});
		} catch (e) {
			reject(e)
		}
	});
}

function getQuote(id) {
	return new Promise((resolve, reject) => {
		if (!id) reject("No ID provided");
		get(`http://bash.org/?${id}`)
			.then(response => {
				const $ = cheerio.load(response);

				if ($('center font').text().includes('not exist')) {
					reject("That quote does not exist");
				}
				const quote = {
					id: $('.quote a b')
						.text()
						.substring(1),
					score: $('.quote font').text(),
					text: $('.qt').text()
				};

				resolve(quote);
			})
			.catch(reason => reject(reason));
	});
}
function random(count = 1, over0 = false) {
	if (over0) return parseQuotes(count, 'http://bash.org/?random1', 50);
	return parseQuotes(count, 'http://bash.org/?random', 50);
}
function latest(count = 1) {
	return parseQuotes(count, 'http://bash.org/?latest', 50);
}
function top(count = 1) {
	return parseQuotes(count, 'http://bash.org/?top', 100);
}
function search(query, count = 1, byNumber = false) {
	let showcount = count;
	if (count <= 10) count = 10;
	else if (count <= 25) count = 25;
	else if (count <= 50) count = 50;
	else if (count <= 75) count = 75;
	else if (count <= 100) count = 100;
	let sort = 0;
	if (byNumber) sort = 1;
	return parseQuotes(showcount, `http://bash.org/?search=${query}&sort=${sort}&show=${count}`, 100);
}

function parseQuotes(count, url, max) {
	return new Promise((resolve, reject) => {
		if (count > max) reject("You took too many!");
		if (count < 1) reject("You can't get for 0 or less quotes");
		get(url)
			.then(response => {
				const $ = cheerio.load(response);

				const quotes = [];
				if ($('center font').text().includes('No results')) {
					reject('No results returned.');
				} else {
					$('.quote a b').each((i, element) => {
						quotes[i] = {};
						quotes[i].id = element.firstChild.data.substring(1);
					});

					$('.quote font').each((i, element) => {
						quotes[i].score = element.firstChild.data;
					});

					$('.qt').each((i, element) => {
						quotes[i].text = '';
						element.children.forEach(child => {
							const data = child.data;
							if (data && data != '') {
								quotes[i].text += child.data;
							}
						});
					});
					if (count === 1) resolve(quotes[0]);
					resolve(quotes.slice(0, count));
				}
			}).catch(reason => reject(reason));
	});
}
module.exports = {
	get: id => {
		return getQuote(id);
	},
	random,
	latest,
	top,
	search
};
