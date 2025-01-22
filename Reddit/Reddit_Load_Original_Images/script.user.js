// ==UserScript==
// @name            Reddit Image Direcly (Farside)
// @namespace       https://greasyfork.org/users/821661
// @match           https://www.reddit.com/media?url=*
// @grant           none
// @version         1.0
// @run-at          document-start
// @author          hdyzen
// @description     This script uses the farside.link gateway to redirect images direcly on reddit
// ==/UserScript==

// This script works thanks to farside.link gateway: https://github.com/benbusby/farside
// Alternatively, you can use an extension to upload the image directly to Reddit:
// Only for Firefox: https://addons.mozilla.org/pt-BR/firefox/addon/load-reddit-images-directly/

const getUrlObj = (url) => new URL(url);

const getImgUrl = (url) => {
	const nUrl = getUrlObj(url);
	const paramUrl = getUrlObj(nUrl.searchParams.get("url"));
	console.log(nUrl);

	if (paramUrl.hostname === "external-preview.redd.it") {
		return `https://farside.link/libreddit/preview/external-pre${paramUrl.pathname + paramUrl.search}`;
	}

	const fileName = paramUrl.pathname.match(/[^-\/]+\.(?:png|jpg|jpeg)$/)?.[0];
	return `https://farside.link/libreddit/img/${fileName}`;
};

window.location.href = getImgUrl(window.location.href);
