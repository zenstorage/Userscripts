// ==UserScript==
// @name                Youtube navigate example
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.youtube.com/*
// @grant               none
// @version             1.0
// @author              hdyzen
// @description         28/04/2025, 11:39:41
// @license             GPL-3.0-only
// ==/UserScript==

const playlistIDH = "...";

const ev = new CustomEvent("yt-navigate", {
    bubbles: true,
    detail: {
        endpoint: {
            browseEndpoint: {
                browseId: `VL${playlistIDH}`,
            },
            commandMetadata: {
                webCommandMetadata: {
                    apiUrl: "/youtubei/v1/browse",
                    url: "/playlist?list=PlaylistNameHereOrAnything",
                    webPageType: "WEB_PAGE_TYPE_PLAYLIST", // type of page
                },
            },
        },
    },
});

buttonInSidebar.dispatchEvent(ev);
