// ==UserScript==
// @name            Redgifs Embed Tweaks (RET)
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @match           https://*/*
// @grant           GM.xmlHttpRequest
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.registerMenuCommand
// @require         https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @version         0.4.4
// @run-at          document-start
// @author          hdyzen
// @description     tweaks redgifs embed/iframe video
// @license         MIT
// ==/UserScript==

const domain = window.location.hostname;

const commands = {
    autoplay: {
        label: "Autoplay",
        state: false,
    },
    loop: {
        label: "Loop",
        state: true,
    },
    volumeSlider: {
        label: "Enable volume slider",
        state: true,
    },
    openLink: {
        label: "Prevent link open",
        state: true,
    },
    savePrefs: {
        label: "Save prefs",
        state: true,
    },
    pauseVideo: {
        label: "Pause video when not visible",
        state: true,
    },
    videoControls: {
        label: "Video controls",
        state: true,
    },
    downloadButton: {
        label: "Download button",
        state: true,
    },
    hideBloat: {
        label: "Remove bloat",
        state: false,
    },
};

async function init() {
    if (domain !== "www.redgifs.com") {
        downloadOnTop();
        return;
    }

    initCSS();
    patchJSONParse();
    patchVideoPlay();

    await initCommands();

    initVideo();
    initPrefs();
    prefsMonitor();
    downloadVisible();
    hideBloat();
}
init();

let videoRoot;

async function getVideo() {
    videoRoot = await asyncQuerySelector("video[src]");
    console.log("Acgou o video");
}

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

function createElement({ tagName, attributes = {}, props = {}, listeners = {} }) {
    const element = document.createElement(tagName);

    const attributesIt = Object.entries(attributes);
    for (const [name, value] of attributesIt) {
        element.setAttribute(name, value);
    }

    const propsIt = Object.entries(props);
    for (const [name, value] of propsIt) {
        element.name = value;
    }

    const listenersIt = Object.entries(listeners);
    for (const [name, value] of listenersIt) {
        element.addEventListener(name, value);
    }

    return element;
}

async function initVideo() {
    await getVideo();

    if (getState("openLink")) {
        videoRoot.parentElement.removeAttribute("href");
    }

    if (getState("pauseVideo")) {
        interVideo(videoRoot);
    }

    if (getState("videoControls")) {
        initVideoControls();
    }

    if (getState("volumeSlider")) {
        initVolumeSlider(videoRoot);
    }

    videoRoot.loop = getState("loop");
}

async function initPrefs() {
    if (!getState("savePrefs")) return;

    const isHD = localStorage.getItem("hd");
    const isMuted = localStorage.getItem("muted");

    if (isHD) {
        const sdButton = await asyncQuerySelector(".button:has([d^='M7.773'])");
        sdButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }

    if (isMuted) {
        const mutedButton = await asyncQuerySelector(".soundOff");
        mutedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
}

async function prefsMonitor() {
    const prefsButton = await asyncQuerySelector(".buttons");

    if (prefsButton == null) return;

    prefsButton.addEventListener("click", e => {
        const target = e.target;

        if (target.closest(".soundOff")) {
            localStorage.setItem("muted", "0");
        }
        if (target.closest(".soundOn")) {
            localStorage.removeItem("muted");
        }
        if (target.closest(".gifQuality:has(> [d^='M7.773'])")) {
            localStorage.setItem("hd", "1");
        }
        if (target.closest(".gifQuality:has(> [d^='M1.16712'])")) {
            localStorage.removeItem("hd");
        }
    });
}

async function initVolumeSlider(video) {
    const inputSlider = createElement({
        tagName: "input",
        attributes: {
            class: "volume-slider",
            type: "range",
            value: (localStorage.getItem("volume") || 0) * 100,
        },
        listeners: {
            input: ev => {
                const volume = ev.target.valueAsNumber / 100;
                video.volume = volume;
                localStorage.setItem("volume", volume);
            },
            mouseup: ev => ev.stopImmediatePropagation(),
        },
    });
    document.body.appendChild(inputSlider);
    video.volume = localStorage.getItem("volume") || 0;
}

function interVideo(video) {
    let intersecting = true;
    const originalPlay = video.play;

    video.play = function () {
        const stackTrace = new Error().stack;

        if (!intersecting && stackTrace.includes("emit")) {
            return Promise.reject(new Error("Prevent video autoplay when not visible"));
        }

        return originalPlay.call(this);
    };

    const handleIntersection = ([entry]) => {
        if (!entry.isIntersecting) {
            video.pause();
        }

        intersecting = entry.isIntersecting;
    };
    const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.4,
    });

    observer.observe(video);
}

function initVideoControls() {
    window.addEventListener("keydown", ev => {
        const key = ev.code;

        let timeStep = ev.shiftKey ? 10 : 5;
        let volumeStep = ev.shiftKey ? 0.1 : 0.05;
        let playbackStep = 0.1;

        switch (key) {
            case "KeyF":
                document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                break;

            case "KeyM":
                videoRoot.muted = !videoRoot.muted;
                break;

            case "Space":
                videoRoot.paused ? videoRoot.play() : videoRoot.pause();
                break;

            case "ArrowLeft":
                videoRoot.currentTime -= timeStep;
                break;

            case "ArrowRight":
                videoRoot.currentTime += timeStep;
                break;

            case "ArrowUp":
                videoRoot.volume = Math.min(1, videoRoot.volume + volumeStep);
                break;

            case "ArrowDown":
                videoRoot.volume = Math.max(0, videoRoot.volume - volumeStep);
                break;

            case "Minus":
                videoRoot.playbackRate -= playbackStep;

                break;
            case "Equal":
                videoRoot.playbackRate += playbackStep;
                break;

            case "Backspace":
                videoRoot.playbackRate = 1;
                break;

            case "Home":
                videoRoot.currentTime = 0;
                break;

            case "End":
                videoRoot.currentTime = videoRoot.duration;
                break;

            default:
                break;
        }
        console.log(ev);
    });
}

function addDownloadEntries(arr) {
    const copySvg = `
        <i class="copy-button">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M20.9983 10C20.9862 7.82497 20.8897 6.64706 20.1213 5.87868C19.2426 5 17.8284 5 15 5H12C9.17157 5 7.75736 5 6.87868 5.87868C6 6.75736 6 8.17157 6 11V16C6 18.8284 6 20.2426 6.87868 21.1213C7.75736 22 9.17157 22 12 22H15C17.8284 22 19.2426 22 20.1213 21.1213C21 20.2426 21 18.8284 21 16V15" stroke-width="1.5" stroke-linecap="round" stroke="#fff"/>
                <path d="M3 10V16C3 17.6569 4.34315 19 6 19M18 5C18 3.34315 16.6569 2 15 2H11C7.22876 2 5.34315 2 4.17157 3.17157C3.51839 3.82475 3.22937 4.69989 3.10149 6" stroke-width="1.5" stroke-linecap="round" stroke="#fff"/>
            </svg>
        </i>
    `;
    const downloadButton = document.createElement("div");
    const downloadEntry = arr.map(e => `<div class="download-entry" data-url="${e[1]}"><span class="download-dw">${e[0]}</span>${copySvg}</div>`).join("\n");
    downloadButton.id = "downloadOpen";

    downloadButton.innerHTML = `
    <svg class="download-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#fff"/>
        <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#fff"/>
    </svg>
    <div id="download-dropdown" class="hidden">
        ${downloadEntry}
    </div>
    `;

    downloadButton.addEventListener("click", e => {
        const downloadOpen = e.target.closest(".download-svg");
        if (downloadOpen) {
            return downloadButton.lastElementChild.classList.toggle("hidden");
        }

        const download = e.target.closest(".download-dw");
        if (download) {
            const url = download.parentElement.dataset.url;
            return downloadAsBlob(url);
        }

        const copy = e.target.closest(".copy-button");
        if (copy) {
            return navigator.clipboard.writeText(copy.parentElement.dataset.url);
        }
    });

    document.body.appendChild(downloadButton);
}

async function downloadAsBlob(vUrl) {
    if (isInIframe()) {
        return window.parent.postMessage({ redUrl: vUrl }, "*");
    }

    try {
        const res = await GM.xmlHttpRequest({
            url: vUrl,
            responseType: "blob",
        });

        const url = URL.createObjectURL(res.response);
        const link = document.createElement("a");
        const nameVideo = vUrl.split("/").at(-1);

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

function downloadOnTop() {
    window.addEventListener("message", e => {
        e.data.url ? downloadAsBlob(e.data?.redUrl) : null;
    });
}

function downloadVisible() {
    if (getState("downloadButton")) GM.addStyle("#downloadOpen { display: block }");
}

function isInIframe() {
    return window !== window.parent;
}

function hideBloat() {
    if (getState("hideBloat"))
        GM.addStyle(`
        .userInfo, .logo, #shareButton { 
            display: none !important;
        }
    `);
}

function getState(key) {
    return commands[key].state;
}

function patchJSONParse() {
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
}

function patchVideoPlay() {
    const originalPlay = HTMLVideoElement.prototype.play;

    HTMLVideoElement.prototype.play = function () {
        const stackTrace = new Error().stack;

        if (!getState("autoplay") && stackTrace.includes("emit")) {
            this.pause();
            return Promise.reject(new Error("Autoplay disabled"));
        }

        return originalPlay.call(this);
    };
}

function initCSS() {
    GM.addStyle(`
        .hidden {
            pointer-events: none;
            opacity: 0;
            overflow: hidden;
        }
        #downloadOpen {
            display: none;
            position: fixed; 
            bottom: 2rem; 
            right: 1rem; 
            user-select: none;

            & > .download-svg {
                cursor: pointer; 
                vertical-align: middle;
            }
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
            gap: .25rem;
        }
        .download-entry {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: .25rem;
            
        }
        .download-dw {
            flex-grow: 1;
        }
        .download-dw, .copy-button {
            padding: .25rem .5rem;
            border-radius: .25rem;
            cursor: pointer;

            &:hover {
                background-color: rgba(255, 255, 255, .05);
            }
        }
        .copy-button > svg {
            vertical-align: middle;
        }
        .volume-slider {
            display: none;
            position: absolute;
            padding-block: 20px;
            height: 5px;
            top: 6px;
            right: 40px;
            width: 110px;
            accent-color: #2a2a81;
        }
        .button:hover .volume-slider {
            display: block;
        }
        body:has(.soundOff:hover, .soundOn:hover) .volume-slider, .volume-slider:hover {
            display: block;
        }
        `);
}
