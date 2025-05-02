// ==UserScript==
// @name                Redgifs Tweaks
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.redgifs.com/*
// @exclude-match       https://www.redgifs.com/ifr/*
// @grant               GM.addStyle
// @grant               GM.download
// @run-at              document-start
// @require             https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @version             0.4.6
// @author              hdyzen
// @description         tweaks for redgifs page
// @license             MIT
// @noframes
// ==/UserScript==

const urlsMap = new Map();

function observerInit() {
    const mutationsHandler = mutations => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.target.classList.contains("GifPreview")) {
                const sidebar = mutation.target.querySelector(".SideBar");

                if (!sidebar || sidebar.querySelector(".download-button")) {
                    return;
                }

                const gifID = mutation.target.id.split("_")[1];

                sidebar.insertAdjacentHTML("beforeend", getDownloadButton(gifID));
            }
        }
    };

    const observer = new MutationObserver(mutationsHandler);

    observer.observe(document.documentElement || document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
    });
}
observerInit();

function patchJSONParse() {
    const originalJParse = JSON.parse;

    JSON.parse = function (text, reviver) {
        const result = originalJParse.call(this, text, reviver);

        if (Array.isArray(result.gifs)) {
            result.gifs = result.gifs.filter(gif => {
                if (gif.cta !== null) return false;

                urlsMap.set(gif.id, gif.urls);
                return true;
            });
        }

        return result;
    };
}
patchJSONParse();

function download(ev) {
    const url = ev.target.getAttribute("url");

    GM.download({
        url: url,
        name: url.split("/").at(-1),
        onprogress(evp) {
            const loaded = (evp.loaded / evp.total) * 100;
            const progress = (loaded / 100) * ev.target.offsetWidth;

            ev.target.style.boxShadow = `${progress}px 0 0 0 rgba(192, 28, 119, 0.5) inset`;
        },
    });
}
unsafeWindow.download = download;

function getDownloadButton(gifID) {
    const urls = urlsMap.get(gifID);
    const entries = Object.entries(urls);
    const buttons = entries
        .filter(([key]) => key !== "html")
        .sort()
        .map(([key, value]) => `<button onclick="download(event)" url="${value}" class="item">${key}</button>`);

    const html = `
    <div class="download-button">
        <label for="${gifID}" class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512" width="28">
                <path d="M336 176h40a40 40 0 0140 40v208a40 40 0 01-40 40H136a40 40 0 01-40-40V216a40 40 0 0140-40h40"
                    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32">
                </path>
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                    d="M176 272l80 80 80-80M256 48v288"></path>
            </svg>
        </label>
        <input type="checkbox" name="${gifID}" id="${gifID}" hidden>
        <div class="list">
            ${buttons.join("")}
        </div >
    </div >
    `;

    return html;
}

GM.addStyle(`
    /* Annoyances */
    .bannerWrapper, .SideBar-Item:has(> [class*="liveAdButton"]) {
        display: none!important;
    }
    .bannerWrapper, div:has(> ._aTab_17ta5_1) {
        visibility: hidden!important;
        opacity: 0!important;
    }

    /* Download button/list */
    .download-button {
        position: relative;
        height: 28px;
        width: 28px;
    }
    .download-button .icon {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
    }
    .download-button > input:checked +.list {
        visibility: visible;
        opacity: 1;
    }
    .download-button .list {
        visibility: hidden;
        opacity: 0;
        display: flex;
        justify-content: center;
        align-content: center;
        flex-direction: column;
        font-size: 1rem;
        background: rgb(10, 10, 10, .8);
        backdrop-filter: blur(20px);
        position: absolute;
        top: 100%;
        right: 100%;
        width: max-content;
        border-radius: 0.75rem;
        border-start-end-radius: 0.25rem;
        overflow: hidden;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, .6);
        border: 1px solid rgba(255, 255, 255, .05);
        transition: .2s ease;

        & > .item {
            padding: .5rem 1rem;
            background: none;
            border: none;
            color: #fff;
            transition: .3s ease background-color;
        }
        & > .item:hover {
            background: rgb(255, 255, 255, .1);
            cursor: pointer;
        }
    }
`);
