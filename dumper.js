const axios = require("axios");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const https = require("https");
const path = require("node:path");

const baseUrl = "https://demoind600serve/osrest/api/icon/ids";

async function getIcon(groupName, iconId) {
	try {
		const options = {
			method: "POST",
			url: baseUrl,
			headers: {
				"Content-Type": "application/json",
				Authorization: "Basic ZGVtbzpkZW1v",
			},
			data: { iconIds: [iconId] },
		};

		const response = await axios.request(options);
		const icons = response.data.icons;
		const failed = response.data.failed || [];

		for (const [id, base64Data] of Object.entries(icons)) {
			const buffer = Buffer.from(base64Data, "base64");
			fs.writeFileSync(`icons/${groupName}/icon_${id}.gif`, buffer);
			//console.log(`Saved icon_${id}.gif`);
		}

		if (failed.length > 0) {
			console.log("The following IDs could not be found on the server:");
			failed.forEach((failure) => {
				console.log(`ID: ${failure.item.id}, Error: ${failure.error.message}`);
			});
		}
	} catch (error) {
		console.error("Error fetching icons[", iconId, "]:", error);
	}
}

async function fetchIcons() {
	const file = await fsp.readFile("icons/enaio_icons.json", {
		encoding: "utf8",
	});
	const jsonData = JSON.parse(file);

	/* abuse AppConnector whilst I still can! */
	for (let group in jsonData) {
		const iconGroup = jsonData[group];

		console.log("Ripping Icon Group", group);
		fs.mkdirSync(`icons/${group}`);
		fs.writeFileSync(`icons/${group}/${group}_icons.json`, JSON.stringify(iconGroup, null, 4));

		const iconsArr = iconGroup["icons"];
		for (let icon in iconsArr) {
			const iconObj = iconsArr[icon];
			await getIcon(group, iconObj.id);
		}
		console.log("Finished ripping", iconsArr.length, "icons from group", group);
	}
}

const main = async () => {
	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});
	axios.defaults.httpsAgent = httpsAgent;

	console.log("Ripping enaio icons via AppConnector base:", baseUrl);
	await fetchIcons();
};

main();
