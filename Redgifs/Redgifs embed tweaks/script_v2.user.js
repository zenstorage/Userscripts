// ==UserScript==
// @name            Redgifs Embed Tweaks (RET)
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @match           https://*/*
// @exclude-match   https://www.google.com/recaptcha/*
// @exclude-match   https://challenges.cloudflare.com/*
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_addValueChangeListener
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @version         0.5.1
// @run-at          document-start
// @author          hdyzen
// @description     tweaks redgifs embed/iframe video
// @license         MIT
// ==/UserScript==

const domain = window.location.hostname;
const isRootWindow = window.top === window.self;

const commands = {
    autoplay: {
        label: "Autoplay",
        state: false,
        applyEffect: autoplayControl,
    },
    loop: {
        label: "Loop",
        state: true,
        applyEffect: loopControl,
    },
    volumeSlider: {
        label: "Enable volume slider",
        state: true,
        applyEffect: volumeSliderControl,
    },
    preventLink: {
        label: "Prevent link opening",
        state: true,
        applyEffect: preventLinkControl,
    },
    saveSettings: {
        label: "Save settings",
        state: true,
        applyEffect: saveSettingsControl,
    },
    syncSettings: {
        label: "Sync settings",
        state: true,
        applyEffect: syncSettingsControl,
    },
    pauseWhenHidden: {
        label: "Pause video when not visible",
        state: true,
        applyEffect: pauseWhenHiddenControl,
    },
    oneAtTime: {
        label: "Play one at a time",
        state: true,
        applyEffect: oneAtTimeControl,
    },
    keyboardShortcuts: {
        label: "Video controls",
        state: true,
        applyEffect: keyboardShortcutsControl,
    },
    showDownload: {
        label: "Show download button",
        state: true,
        applyEffect: showDownloadControl,
    },
    pruneUI: {
        label: "Prune UI",
        state: false,
        applyEffect: pruneUIControl,
    },
    detectVideoPatching: {
        label: "Detect video patching native method",
        state: false,
        applyEffect: () => {},
    },
    reloadOnDemand: {
        label: "Reload iframes on demand",
        state: false,
        applyEffect: reloadOnDemandControl,
    },
};

if (isRootWindow) {
    loadCommands();

    GM_addValueChangeListener("reloadOnDemand", () => {
        window.location.reload();
    });
}

if (domain !== "www.redgifs.com") {
    downloadOnTop();
}

if (domain === "www.redgifs.com") {
    patchJSONParse();
    initVideo();
}

function loadCommands() {
    for (const key in commands) {
        commands[key].state = GM_getValue(key, commands[key].state);

        const command = commands[key];
        const label = command.label;
        const state = command.state;

        GM_registerMenuCommand(`${state ? "⧯" : "⧮"} ${label}`, () => toggleCommand(key, state), { id: key, autoClose: false });
    }
}

function toggleCommand(key, state) {
    const command = commands[key];
    const label = command.label;
    const newState = !state;
    GM_registerMenuCommand(`${newState ? "⧯" : "⧮"} ${label}`, () => toggleCommand(key, newState), { id: key, autoClose: false });

    GM_setValue(key, newState);
    GM_setValue("reload", Math.random());
}

async function initVideo() {
    const applyCommands = (video) => {
        for (const key in commands) {
            const state = GM_getValue(key, commands[key].state);

            commands[key].applyEffect(video, state);
        }
    };

    if (commands.detectVideoPatching.state === true) {
        const originalCreateElement = Document.prototype.createElement;

        Document.prototype.createElement = new Proxy(originalCreateElement, {
            apply(target, thisArg, argsList) {
                const result = Reflect.apply(target, thisArg, argsList);

                if (argsList[0] === "video") {
                    result.addEventListener("canplay", () => applyCommands(result));
                }

                return result;
            },
        });
    } else {
        const getVideo = async () => {
            return new Promise((resolve) => {
                const observer = new MutationObserver((_, observer) => {
                    const video = document.querySelector("video[src]:not([src=''])");
                    if (video) {
                        observer.disconnect();
                        resolve(video);
                    }
                });
                observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
            });
        };
        const video = await getVideo();
        applyCommands(video);
    }
}

const click = (element, eventObj = { bubbles: true, cancelable: true }) => element?.dispatchEvent(new MouseEvent("click", eventObj));

function updateVolumeUI(video, volume) {
    GM_setValue("volume", volume);
    video.volume = volume;
    video.inputElement.value = volume;

    if (volume > 0) {
        click(document.querySelector(".soundOff"));
    } else {
        click(document.querySelector(".soundOn"));
    }
}

function autoplayControl(video, state) {
    if (state) video.oncanplay = () => video.play();
    video.autoplay = state;
}

function loopControl(video, state) {
    video.loop = state;
}

async function volumeSliderControl(video, state) {
    if (!state) return;

    const volumeContainer = document.querySelector(".buttons:has(> div > .soundOff,> div > .soundOn)");
    if (!volumeContainer) return;

    const inputElement = document.createElement("input");
    video.inputElement = inputElement;
    inputElement.type = "range";
    inputElement.min = 0;
    inputElement.max = 1;
    inputElement.step = 0.01;
    inputElement.value = GM_getValue("volume", 0);

    inputElement.oninput = (e) => {
        const volume = e.target.value;
        updateVolumeUI(video, volume);
    };
    inputElement.onmouseup = (e) => e.stopImmediatePropagation();

    volumeContainer.appendChild(inputElement);
}

function preventLinkControl(video, state) {
    if (!state) return;

    const target = video.closest("a[href]");
    target.onclick = (ev) => ev.preventDefault();
}

async function saveSettingsControl(video, state) {
    if (!state) return;

    const enableSoundValue = GM_getValue("enableSound");
    if (enableSoundValue) {
        click(document.querySelector(".soundOff"));
    }

    const enableHDValue = GM_getValue("enableHD");
    if (enableHDValue) {
        click(document.querySelector(".gifQuality:has([d^='M1 12C1'])"));
    }

    const volumeValue = GM_getValue("volume", 1);
    video.volume = Math.min(1, volumeValue);

    detectButtonsClick();
}

function detectButtonsClick() {
    const buttons = document.querySelector(".buttons");

    buttons.onclick = (ev) => {
        const button = ev.target.closest("div.button");
        if (!button) return;

        if (button.matches(":has(.soundOff)")) {
            GM_setValue("enableSound", true);
            return;
        }
        if (button.matches(":has(.soundOn)")) {
            GM_setValue("enableSound", false);
            return;
        }
        if (button.matches(":has(.gifQuality [d^='M1 12C1'])")) {
            GM_setValue("enableHD", true);
            return;
        }
        if (button.matches(":has(.gifQuality [d^='M1.16712'])")) {
            GM_setValue("enableHD", false);
            return;
        }
    };
}

function syncSettingsControl(video, state) {
    if (!state) return;

    GM_addValueChangeListener("enableSound", (_name, _oldValue, newValue) => {
        if (newValue) {
            click(document.querySelector(".soundOff"));
            return;
        }

        click(document.querySelector(".soundOn"));
    });

    GM_addValueChangeListener("enableHD", (_name, _oldValue, newValue) => {
        if (newValue) {
            click(document.querySelector(".gifQuality:has([d^='M1 12C1'])"));
            return;
        }

        click(document.querySelector(".gifQuality:has([d^='M1.16712'])"));
    });

    GM_addValueChangeListener("volume", (_name, _oldValue, volume) => {
        if (!volume) return;

        updateVolumeUI(video, volume);
    });
}

function pauseWhenHiddenControl(video, state) {
    if (!state) return;

    const handleIntersection = ([entry]) => {
        if (!entry.isIntersecting) {
            video.pause();
        }
    };
    const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.6,
    });

    observer.observe(video);
}

function oneAtTimeControl(video, state) {
    if (!state) return;

    const gifID = unsafeWindow.location.pathname.split("/").at(-1);

    video.addEventListener("play", () => GM_setValue("playing", gifID));
    GM_addValueChangeListener("playing", (_name, _oldValue, newValue) => {
        if (newValue === gifID) return;
        video.pause();
    });
}

function keyboardShortcutsControl(video, state) {
    if (!state) return;

    const keyActionHandler = (event) => {
        const key = event.code;
        const timeStep = event.shiftKey ? 10 : 5;
        const volumeStep = event.shiftKey ? 0.1 : 0.05;
        const playbackStep = 0.1;

        switch (key) {
            case "KeyF":
                document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                break;
            case "KeyM":
                video.muted = !video.muted;
                break;
            case "Space":
                video.paused ? video.play() : video.pause();
                break;
            case "ArrowLeft":
                video.currentTime -= timeStep;
                break;
            case "ArrowRight":
                video.currentTime += timeStep;
                break;
            case "ArrowUp":
                updateVolumeUI(video, Math.min(1, video.volume + volumeStep));
                break;
            case "ArrowDown":
                updateVolumeUI(video, Math.max(0, video.volume - volumeStep));
                break;
            case "Minus":
                video.playbackRate -= playbackStep;
                break;
            case "Equal":
                video.playbackRate += playbackStep;
                break;
            case "Backspace":
                video.playbackRate = 1;
                break;
            case "Home":
                video.currentTime = 0;
                break;
            case "End":
                video.currentTime = video.duration;
                break;
        }
    };

    window.addEventListener("keydown", keyActionHandler);
}

function showDownloadControl(_video, state) {
    if (!state) return;

    GM_addStyle("#downloadOpen { display: block }");
}

function pruneUIControl(_video, state) {
    if (!state) return;

    GM_addStyle(".userInfo, .logo, #shareButton { display: none !important; }");
}

function reloadOnDemandControl(_video, state) {
    let isIntersecting = false;
    let shouldReload = false;

    if (state) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                isIntersecting = entry.isIntersecting;

                if (isIntersecting && shouldReload) {
                    window.location.reload();
                }
            },
            { rootMargin: "100px" },
        );
        observer.observe(document.documentElement);
    }

    GM_addValueChangeListener("reload", () => {
        if (!state) {
            window.location.reload();
            return;
        }

        if (isIntersecting) {
            window.location.reload();
        } else {
            shouldReload = true;
        }
    });
}

async function downloadAsBlob(vUrl, downloadElementEntry) {
    if (!isRootWindow) {
        return unsafeWindow.parent.postMessage({ redgifsURL: vUrl }, "*");
    }

    try {
        GM_xmlhttpRequest({
            url: vUrl,
            responseType: "blob",
            onprogress(event) {
                if (!downloadElementEntry) {
                    return;
                }

                const loaded = (event.loaded / event.total) * 100;
                const progress = (loaded / 100) * downloadElementEntry.offsetWidth;

                downloadElementEntry.style.boxShadow = `${progress}px 0 0 0 rgba(192, 28, 119, 0.5) inset`;
            },
            onload(event) {
                const url = URL.createObjectURL(event.response);
                const link = document.createElement("a");
                const nameVideo = vUrl.split("/").at(-1);

                link.href = url;
                link.download = nameVideo;

                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

                URL.revokeObjectURL(url);
            },
        });
    } catch (error) {
        console.error("Error downloading video:", error);
    }
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
    const downloadEntry = arr.map((e) => `<div class="download-entry" data-url="${e[1]}"><span class="download-dw">${e[0]}</span>${copySvg}</div>`).join("\n");
    downloadButton.id = "downloadOpen";

    downloadButton.innerHTML = `
        <svg class="download-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#fff"/>
            <path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#fff"/>
        </svg>
        <div id="download-dropdown" class="ret-hidden">
            ${downloadEntry}
        </div>
        `;

    downloadButton.addEventListener("click", (e) => {
        const downloadOpen = e.target.closest(".download-svg");
        if (downloadOpen) {
            return downloadButton.lastElementChild.classList.toggle("ret-hidden");
        }

        const download = e.target.closest(".download-dw");
        if (download) {
            const url = download.parentElement.dataset.url;
            return downloadAsBlob(url, download);
        }

        const copy = e.target.closest(".copy-button");
        if (copy) {
            return navigator.clipboard.writeText(copy.parentElement.dataset.url);
        }
    });

    document.body.appendChild(downloadButton);
}

function downloadOnTop() {
    const messageFunc = (e) => {
        if (!e.data?.redgifsURL) return;

        downloadAsBlob(e.data.redgifsURL);
    };

    unsafeWindow.addEventListener("message", messageFunc);
}

function patchJSONParse() {
    const originalJParse = JSON.parse;

    JSON.parse = (text, reviver) => {
        const result = originalJParse.call(JSON, text, reviver);
        if (result.gif) {
            const urls = Object.entries(result.gif.urls);
            const ext = urls.map(([n, u]) => [`${u.split(".").at(-1)} - ${n}`, u]).sort();

            addDownloadEntries(ext);
        }

        return result;
    };
}

GM_addStyle(`
#root > .App .embeddedPlayer .buttons > input {
    display: none;
    position: absolute;
    top: -7px;
    padding: .5rem;
    right: calc(100% - 5px);
    width: 120px;
    background: none;
    border-radius: .5rem;

    &::-moz-range-progress {
        background: #8e18ee;
        height: .5rem;
        border-radius: 0.25rem;
    }
    &::-moz-range-track {
        background: #fff;
        height: .5rem;
        border-radius: 0.3rem;
    }
}
#root > .App .embeddedPlayer .buttons:has(.soundOn:hover, .soundOff:hover) > input, .buttons > input:hover {
    display: block !important;
}
html:has(> head > meta[property="og:site_name"][content="RedGIFs"]) .ret-hidden {
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
    transition: box-shadow .3s ease-in-out;
    cursor: pointer;

    &:hover {
        background-color: rgba(255, 255, 255, .05);
    }
}
.copy-button > svg {
    vertical-align: middle;
}
`);
