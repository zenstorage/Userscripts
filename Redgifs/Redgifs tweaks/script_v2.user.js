// ==UserScript==
// @name                Redgifs Tweaks
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.redgifs.com/*
// @exclude-match       https://www.redgifs.com/ifr/*
// @grant               GM.registerMenuCommand
// @grant               GM.addStyle
// @grant               GM.download
// @grant               GM.setValue
// @grant               GM.getValue
// @run-at              document-start
// @require             https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @version             0.4.5.1
// @author              hdyzen
// @description         tweaks for redgifs page
// @license             MIT
// @noframes
// ==/UserScript==

const commands = {
    downloadButton: {
        label: "Download button",
        state: true,
    },
    removeBoosted: {
        label: "Remove boosted/promoted",
        state: true,
    },
    removeAnnoyances: {
        label: "Remove annoyances",
        state: true,
    },
};

async function init() {
    patchJSONParse();

    await initCommands();

    addDownloadButton();
}
init();

async function initCommands() {
    const comm = Object.entries(commands);

    for (let i = 0; i < comm.length; i++) {
        const key = comm[i][0];
        const label = comm[i][1].label;
        const state = await GM.getValue(key, comm[i][1].state);

        commands[key].state = state;

        GM.registerMenuCommand(`${label}: ${state ? "ON" : "OFF"}`, async () => {
            await GM.setValue(key, !state);

            window.location.reload();
        });
    }
}

function getState(key) {
    return commands[key].state;
}

async function addDownloadButton(id, urls) {
    const sidebar = await asyncQuerySelector(".SideBar");
    const entries = Object.entries(urls);

    const downloadButton = document.createElement("li");
    downloadButton.classList.add("SideBar-Item");
    downloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px" fill="#fff" ><path d="M 2.376 16.645 C 2.376 16.003 1.843 15.485 1.188 15.485 C 0.533 15.485 0 16.003 0 16.645 L 2.376 16.645 Z M 1.188 18.194 L 0 18.194 L 1.188 18.194 Z M 24 16.645 C 24 16.003 23.467 15.485 22.812 15.485 C 22.157 15.485 21.624 16.003 21.624 16.645 L 24 16.645 Z M 11.064 17.48 C 10.659 17.986 10.752 18.715 11.27 19.109 C 11.786 19.502 12.535 19.413 12.936 18.907 L 11.064 17.48 Z M 19.116 11.166 C 19.519 10.661 19.428 9.93 18.909 9.538 C 18.392 9.141 17.645 9.23 17.242 9.738 L 19.116 11.166 Z M 11.064 18.907 C 11.465 19.413 12.214 19.502 12.73 19.109 C 13.248 18.715 13.341 17.986 12.936 17.48 L 11.064 18.907 Z M 6.758 9.738 C 6.355 9.23 5.608 9.141 5.091 9.538 C 4.572 9.93 4.481 10.661 4.884 11.166 L 6.758 9.738 Z M 10.812 18.194 C 10.812 18.834 11.344 19.355 12 19.355 C 12.656 19.355 13.188 18.834 13.188 18.194 L 10.812 18.194 Z M 13.188 1.162 C 13.188 0.52 12.656 0 12 0 C 11.344 0 10.812 0.52 10.812 1.162 L 13.188 1.162 Z M 0 16.645 L 0 18.194 L 2.376 18.194 L 2.376 16.645 L 0 16.645 Z M 0 18.194 C 0 21.373 2.58 24 5.822 24 L 5.822 21.678 C 3.948 21.678 2.376 20.147 2.376 18.194 L 0 18.194 Z M 5.822 24 L 18.178 24 L 18.178 21.678 L 5.822 21.678 L 5.822 24 Z M 18.178 24 C 21.42 24 24 21.373 24 18.194 L 21.624 18.194 C 21.624 20.147 20.052 21.678 18.178 21.678 L 18.178 24 Z M 24 18.194 L 24 16.645 L 21.624 16.645 L 21.624 18.194 L 24 18.194 Z M 12.936 18.907 L 19.116 11.166 L 17.242 9.738 L 11.064 17.48 L 12.936 18.907 Z M 12.936 17.48 L 6.758 9.738 L 4.884 11.166 L 11.064 18.907 L 12.936 17.48 Z M 13.188 18.194 L 13.188 1.162 L 10.812 1.162 L 10.812 18.194 L 13.188 18.194 Z" /></svg>
        <div class="dropdown-downloads">
            <span class="download-entry">${"a"}</span>
            <span>720</span>
            <span>430</span>
        </div>
        `;

    downloadButton.addEventListener("click", () => {
        console.log("Download started");
        GM.download({
            url: "",
            name: "",
        });
    });

    sidebar.appendChild(downloadButton);
    // console.log(sidebar);
}

function patchJSONParse() {
    const originalJParse = JSON.parse;

    JSON.parse = function (text, reviver) {
        const result = originalJParse.call(this, text, reviver);
        if (result.gifs) {
            for (const gif of result.gifs) {
                const { id, urls } = gif;

                console.log(id, urls);

                // addDownloadButton(id, urls);
            }
        }

        return result;
    };
}
