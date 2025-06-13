// ==UserScript==
// @name                Func tests
// @namespace           https://greasyfork.org/users/821661
// @match               https://*/*
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
// @grant               none
// @version             1.0
// @author              hdyzen
// @description         some tests here
// @license             GPL-3.0-only
// ==/UserScript==

UST.queryEach("a[href*='/anime-list/'", (element) => {
	if (!element.offsetParent) {
		return;
	}
	console.log(element);
});
