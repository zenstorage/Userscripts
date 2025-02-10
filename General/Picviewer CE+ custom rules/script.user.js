// ==UserScript==
// @name         Picviewer CE+ custom rules
// @namespace    hoothin
// @version      0.1
// @description  Picviewer CE+ custom rules
// @author       You
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

window.pvcepRules = (window.pvcepRules || []).concat([
	//Delete these two example rules and add your own.
	{
		name: "Reddit Original Images",
		url: /^https:\/\/www\.reddit.com\/.*/,
		src: /preview\.redd\.it/i,
		r: /.+(?:-|\/)([^-]+\.(?:jpeg|jpg|png)).*/i,
		s: "//i.redd.it/$1",
	},
]);
