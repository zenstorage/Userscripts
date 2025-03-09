// ==UserScript==
// @name                Ignore go to (Socialmediagirls)
// @namespace           https://greasyfork.org/users/821661
// @match               https://forums.socialmediagirls.com/*
// @grant               none
// @version             1.0
// @run-at              document-start
// @author              hdyzen
// @description         21/02/2025, 13:01:16
// @license             GPL-3.0-only
// ==/UserScript==

function initObserver() {
    const handleMutations = mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeName === "A" && node.href.includes("/goto/link-confirmation?url=")) {
                    node.href = getUrl(node.search);
                }
            }
        }
    };

    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
    });

    disObserver(observer);
}
initObserver();

function disObserver(observer) {
    document.addEventListener("DOMContentLoaded", e => {
        observer.disconnect();
        console.log("Observer disconnected");
    });
}

function getUrl(search) {
    const params = new URLSearchParams(search);
    const url = params.get("url");

    return atob(url);
}
