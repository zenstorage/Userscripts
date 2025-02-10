// ==UserScript==
// @name            Redgifs Embed Tweaks
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @match           https://www.redgifs.com/ifr/*
// @grant           GM.xmlHttpRequest
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.registerMenuCommand
// @require         https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @version         0.3.6
// @run-at          document-start
// @author          hdyzen
// @description     tweaks redgifs embed/iframe video
// @license         MIT
// ==/UserScript==

let states;

async function init() {
    states = await initCommands();

    initVideo();
    initPrefs();
    prefsMonitor();
    downloadVisible();
}
init();

async function initCommands() {
    const labels = ["Autoplay", "Prevent link open", "Save prefs", "Download button"];
    const commands = JSON.parse(await GM.getValue("commands", "[0, 1, 1, 1]"));

    for (let i = 0; i < commands.length; i++) {
        const label = labels[i];
        const state = commands[i];

        console.log(label, state);
        GM.registerMenuCommand(`${label}: ${state ? "ON" : "OFF"}`, async () => {
            commands[i] = !commands[i];

            await GM.setValue("commands", JSON.stringify(commands));

            window.location.reload();
        });
    }

    return commands;
}
// initCommands()

async function initVideo() {
    const video = await asyncQuerySelector("video[src]");

    if (states[1]) {
        video.parentElement.removeAttribute("href");
    }

    if (!states[0]) {
        video.addEventListener("canplay", () => {
            video.pause();
        });
    }
}
// initVideo();

async function initPrefs() {
    if (!states[2]) return;

    const isHD = localStorage.getItem("hd");
    const isMuted = localStorage.getItem("muted");

    if (isHD) {
        const sdButton = await asyncQuerySelector(".button:has([d^='M7.773'])");
        sdButton?.click();
    }

    if (isMuted) {
        const mutedButton = await asyncQuerySelector(".soundOff");
        mutedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
}
// initPrefs();

async function prefsMonitor() {
    const prefsButton = await asyncQuerySelector(".buttons");

    if (prefsButton == null) return;

    prefsButton.addEventListener("click", (e) => {
        if (e.target.closest(".soundOff")) {
            localStorage.setItem("muted", "0");
        }
        if (e.target.closest(".soundOn")) {
            localStorage.removeItem("muted");
        }
        if (e.target.closest(".gifQuality [d^='M7.773']")) {
            localStorage.setItem("hd", "1");
        }
        if (e.target.closest(".gifQuality [d^='M1.16712']")) {
            localStorage.removeItem("hd");
        }
    });
}
// prefsMonitor();

function addDownloadEntries(arr) {
    const downloadButton = document.createElement("div");
    downloadButton.classList.add("download-button");

    downloadButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#fff"/>
        <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#fff"/>
    </svg>
    <div id="download-dropdown" class="hidden">
        ${arr.map((e) => `<span data-url="${e[1]}" >${e[0]}</span>`).join("\n")}
    </div>
    `;

    downloadButton.addEventListener("click", (e) => {
        if (e.target.classList.contains("download-button") || e.target.nodeName === "svg" || e.target.nodeName === "path") {
            downloadButton.lastElementChild.classList.toggle("hidden");
        } else {
            console.log(e.target);
            downloadAsBlob(e.target.dataset.url);
        }
    });

    document.body.appendChild(downloadButton);
}

async function downloadAsBlob(urlD) {
    try {
        const response = await GM.xmlHttpRequest({
            url: urlD,
            responseType: "blob",
            onerror: (e) => {
                throw new Error("Network response error: ", e);
            },
        });

        const url = URL.createObjectURL(response.response);
        const link = document.createElement("a");
        const nameVideo = urlD.split("/").at(-1);

        link.href = url;
        link.download = nameVideo;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading video:", error);
    }
}

function downloadVisible() {
    if (!states[3]) GM.addStyle(".download-button { display: none }");
}

const originalJParse = JSON.parse;

JSON.parse = function (text, reviver) {
    const result = originalJParse.call(this, text, reviver);
    if (result.gif) {
        const urls = Object.entries(result.gif.urls);
        const ext = urls.map(([n, u]) => [`${u.split(".").at(-1)} - ${n}`, u]).sort();

        addDownloadEntries(ext);
    }

    return result;
};

GM.addStyle(`
    .hidden {
        pointer-events: none;
        opacity: 0;
        overflow: hiddem;
    }
    .download-button {
        position: fixed; 
        bottom: 1rem; 
        right: 1rem; 
        cursor: pointer; 
        user-select: none;
    }
    #download-dropdown {
        position: absolute;
        bottom: 100%;
        padding: 10px;
        right: 0;
        background: rgb(6, 6, 20);
        margin-bottom: .5rem;
        border-radius: .75rem;
        display: flex;
        flex-direction: column;
        width: max-content;
        gap: .5rem;

        & > * {
            padding-inline: .5rem;
            border-radius: .25rem;
            cursor: pointer;
        }
        & > *:hover {
            background-color: rgba(255, 255, 255, .05)
        }
    }    
`);
