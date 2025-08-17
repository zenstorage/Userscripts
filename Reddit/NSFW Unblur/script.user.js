// ==UserScript==
// @name            Reddit NSFW Unblur Minimal
// @namespace       https://greasyfork.org/users/821661
// @match           https://www.reddit.com/*
// @match           https://sh.reddit.com/*
// @grant           GM_addElement
// @grant           GM_setValues
// @grant           GM_getValues
// @grant           GM_getResourceURL
// @grant           GM_getResourceText
// @resource        style https://zenstorage.github.io/Reddit-NSFW-Unblur/userscript/style.css
// @resource        style2 http://127.0.0.1:5500/Reddit/NSFW Unblur/style.css
// @require         http://127.0.0.1:5500/General/USToolkit/script.user.js
// @run-at          document-body
// @noframes
// @version         2.4.4
// @icon            https://raw.githubusercontent.com/zenstorage/Reddit-NSFW-Unblur/main/assets/icon.png
// @author          hdyzen
// @description     Unblur nsfw in Shreddit
// @license         MIT
// @homepage        https://github.com/zenstorage/Reddit-NSFW-Unblur
// @downloadURL     https://update.greasyfork.org/scripts/485608/Reddit%20NSFW%20Unblur.user.js
// @updateURL       https://update.greasyfork.org/scripts/485608/Reddit%20NSFW%20Unblur.meta.js
// ==/UserScript==

const { enabled, nsfw, spoiler } = GM_getValues({
	enabled: true,
	nsfw: true,
	spoiler: false,
});
const OPENED_ATTRIBUTE = "unblur-menu-opened";

const onFoundBlurred = (node) => {
	console.log(node);

	const reason = node.getAttribute("reason");
	const nsfwEnabled = reason === "nsfw" && nsfw;
	const spoilerEnabled = reason === "spoiler" && spoiler;

	if (!nsfwEnabled || !spoilerEnabled) {
		return;
	}

	node.blurred = false;
};

const mutationHandler = (mutations) => {
	for (const mutation of mutations) {
		// if (!mutation.target.matches("shreddit-blurred-container")) {
		// 	continue;
		// }

		for (const node of mutation.addedNodes) {
			if (node.nodeType !== Node.ELEMENT_NODE) {
				continue;
			}

			// if (node.slot === "revealed") {
			// 	// console.log(mutation);
			// 	node.parentElement.blurred = false;
			// }

			if (node.querySelector("[slot='revealed']")) {
				console.log(mutation);
			}
		}
	}
};

async function init() {
	await UST.addStyle(GM_getResourceText("style2"));
	UST.update(onUpdate);
}
init();

function onUpdate() {
	const node = document.querySelector("reddit-header-action-items [data-part='primary']");

	if (!node) {
		return;
	}

	const content = UST.templates.render("Unblur");
	const label = content.querySelector("#unblur-label");
	const form = content.querySelector("form");
	const { enabled, nsfw, spoiler } = Object.fromEntries(
		[...content.querySelectorAll("input[state-name]")].map((input) => [input.getAttribute("state-name"), input]),
	);

	label.onclick = () => {
		document.body.toggleAttribute(OPENED_ATTRIBUTE);
	};
	form.oninput = () => {
		console.log(enabled);
		GM_setValues({
			enabled: enabled.checked,
			nsfw: nsfw.checked,
			spoiler: spoiler.checked,
		});
	};
	document.addEventListener("click", (event) => {
		if (document.body.hasAttribute(OPENED_ATTRIBUTE) && !event.target.closest("#unblur-menu")) {
			document.body.removeAttribute(OPENED_ATTRIBUTE);
		}
	});

	node.appendChild(content);

	return true;
}

UST.observe(mutationHandler, document, { childList: true, subtree: true });

// biome-ignore format: avoid
UST.templates.set("Unblur", `
    <div id="unblur-menu">
        <span id="unblur-label">Unblur</span>
        <form id="unblur-status-container">
            <div id="unblur-status"></div>
            <div id="unblur-toggle-container">
                <label for="unblur-toggle">
                    <input id="unblur-toggle" name="unblur-toggle" state-name="enabled" type="checkbox">
                    <svg viewBox="0 0 24 24">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12V3ZM8.6092 5.8744C9.09211 5.60643 9.26636 4.99771 8.99839 4.5148C8.73042 4.03188 8.12171 3.85763 7.63879 4.1256C4.87453 5.65948 3 8.61014 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 8.66747 19.1882 5.75928 16.5007 4.20465C16.0227 3.92811 15.4109 4.09147 15.1344 4.56953C14.8579 5.04759 15.0212 5.65932 15.4993 5.93586C17.5942 7.14771 19 9.41027 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 9.3658 6.45462 7.06997 8.6092 5.8744Z">
                        </path>
                    </svg>
                </label>
            </div>
            <div id="unblur-options">
                <label for="unblur-nsfw-toggle">
                    <input type="checkbox" name="unblur-nsfw-toggle" state-name="nsfw" id="unblur-nsfw-toggle">
                    <span class="unblur-slider"></span>
                    <span class="unblur-slider-label">Unblur NSFW</span>
                </label>
                <label for="unblur-spoiler-toggle">
                    <input type="checkbox" name="unblur-spoiler-toggle" state-name="spoiler" id="unblur-spoiler-toggle">
                    <span class="unblur-slider"></span>
                    <span class="unblur-slider-label">Unblur Spoiler</span>
                </label>
            </div>
        </form>
    </div>	
`);
