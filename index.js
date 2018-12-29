const WAITTIME = 500; // Waiting time between attempts in milliseconds

const fs = require("fs-extra");
const fetchCommentPage = require("youtube-comment-api");

const YT_REGEX = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/i;

let comments = [];
let parsed = [];

(async () => {
	try {
		const delay = (time) => new Promise((res) => setTimeout(() => res(), time));

		if (!fs.existsSync("./links.txt"))
			throw Error("Can't find links.txt! Put your line-break seperated links in a links.txt file and try again.");

		const listFile = await fs.readFile("./links.txt", "utf8");
		const list = listFile.split("\n").map((l) => l.trim());

		for (const link in list) {
			if (list.hasOwnProperty(link)) {
				if (list[link] === "") continue;

				const match = list[link].match(YT_REGEX);

				if (!match) {
					await console.log(`Skipping line #${parseInt(link) + 1} because it's not a valid link`);
					continue;
				}

				if (parsed.includes(match[1])) {
					await console.log(`Skipping line #${parseInt(link) + 1} because we already parsed it`);
					continue;
				}

				parsed.push(match[1]);

				let token = "";
				while (true) {
					let commentPage = await fetchCommentPage(match[1], token ? token : undefined);

					comments.push(
						...commentPage.comments.map((o) => {
							return { video: match[1], ...o };
						})
					);

					if (!commentPage.nextPageToken) break;
					else token = commentPage.nextPageToken;
				}

				await delay(WAITTIME);
			}
		}

		fs.writeFile("./comments.json", JSON.stringify(comments));

		console.log(`Output written to ./comments.json`);
	} catch (e) {
		console.error(e);
	}
})();
