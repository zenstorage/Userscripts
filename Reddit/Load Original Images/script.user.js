// ==UserScript==
// @name            Reddit Image Direcly
// @namespace       https://greasyfork.org/users/821661
// @match           https://www.reddit.com/media?url=*
// @grant           none
// @version         1.1
// @run-at          document-start
// @license         GPL-3.0
// @author          hdyzen
// @description     This script uses the farside.link gateway to redirect images direcly on reddit
// ==/UserScript==

const getUrlObj = (url) => new URL(url);

const getImgUrl = (url) => {
	const urlObj = getUrlObj(url);

	return urlObj.searchParams.get("url");
};

window.location.href = `https://reddit-load-images-directly.vercel.app/?url=${getImgUrl(window.location.href)}`;
