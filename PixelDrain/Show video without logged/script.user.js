// ==UserScript==
// @name                Show video without logged(only available while logged)
// @namespace           https://greasyfork.org/users/821661
// @match               https://pixeldrain.com/u/*
// @grant               none
// @version             1.0
// @author              hdyzen
// @description         Show video without logged in pixeldrain(only available while logged)
// @license             GPL-3.0-only
// ==/UserScript==

const fileId = window.location.pathname.split("/").at(-1);

const titleFile = document.querySelector(".file_preview h1");
if (titleFile) {
    titleFile.insertAdjacentHTML("afterend", `<video width="100%" height="600px" style="background-color: #000;" src="https://pixeldrain.com/api/file/${fileId}?download" controls></video>`);
}
