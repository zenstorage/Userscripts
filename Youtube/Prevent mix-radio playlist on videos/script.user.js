// ==UserScript==
// @name         Prevent mix/radio playlist on videos
// @namespace    https://greasyfork.org/users/821661
// @version      1.3
// @description  prevent mix/radio playlist on videos
// @author       hdyzen
// @match        https://*.youtube.com/*
// @grant        none
// @license      GPL-3.0-only
// ==/UserScript==

const endpointMap = {
	"ytd-rich-item-renderer"(thumb) {
		return thumb?.data?.content?.videoRenderer?.navigationEndpoint;
	},
	"ytd-compact-video-renderer"(thumb) {
		return thumb?.data?.navigationEndpoint;
	},
	"yt-lockup-view-model"(thumb) {
		return thumb?.componentProps?.data[Object?.getOwnPropertySymbols(thumb?.componentProps?.data)[0]]?.value
			?.rendererContext?.commandContext?.onTap?.innertubeCommand;
	},
	"ytd-video-renderer"(thumb) {
		return thumb?.data?.navigationEndpoint;
	},
};

function satinize(selector) {
	const thumbs = document.querySelectorAll(`${selector}:not([satinized])`);

	for (const thumb of thumbs) {
		const linkThumb = thumb.querySelector("a[href*='v='][href*='pp=']");

		if (linkThumb) {
			const searchParams = new URLSearchParams(linkThumb.search);
			linkThumb.search = `?v=${searchParams.get("v")}`;
		}

		const endpoint = endpointMap[selector](thumb);
		const url = endpoint?.commandMetadata?.webCommandMetadata?.url;

		if (!url) {
			continue;
		}

		if (!(url.includes("pp=") && url.includes("list="))) {
			thumb.setAttribute("satinized", "");
			continue;
		}

		thumb.setAttribute("satinized", "");

		const videoIdParam = url
			.replace("/watch?", "")
			.split("&")
			.find((param) => param.startsWith("v="));

		endpoint.commandMetadata.webCommandMetadata.url = `/watch?${videoIdParam}`;

		endpoint.watchEndpoint.playerParams = "";
		endpoint.watchEndpoint.playlistId = "";
	}
}

const observer = new MutationObserver(() => {
	if (window.location.href === "https://www.youtube.com/") {
		satinize("ytd-rich-item-renderer");
	}

	if (window.location.pathname === "/watch") {
		satinize("ytd-compact-video-renderer");
		satinize("yt-lockup-view-model");
	}

	if (window.location.pathname === "/results") {
		satinize("ytd-video-renderer");
	}
});

observer.observe(document.body, { childList: true, subtree: true });
