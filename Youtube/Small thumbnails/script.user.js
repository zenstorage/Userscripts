// ==UserScript==
// @name        Youtube Small Thumbnails
// @namespace   https://greasyfork.org/users/821661
// @match       https://www.youtube.com/*
// @grant       none
// @description small thumbnails for youtube
// @version     1.2
// @author      hdyzen
// @license     MIT
// ==/UserScript==

async function init() {
    const res = await fetch("https://raw.githubusercontent.com/zenstorage/Userscripts/refs/heads/main/Youtube/Small%20thumbnails/style.css");
    const resText = await res.text();

    if (window.trustedTypes) {
        const policy = window.trustedTypes.createPolicy("default", {
            createHTML: input => input,
        });

        const trustedHTML = policy.createHTML(`
            <style>${resText}</style>
        `);

        document.head.innerHTML += trustedHTML;
    } else {
        document.head.innerHTML += `
            <style>${resText}</style>
        `;
    }
}

init();
