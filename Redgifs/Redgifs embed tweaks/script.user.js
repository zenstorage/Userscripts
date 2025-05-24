// ==UserScript==
// @name            Redgifs Embed Tweaks (RET)
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @match           https://*/*
// @exclude-match   https://www.google.com/recaptcha/*
// @grant           GM.xmlHttpRequest
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.getValues
// @grant           GM.registerMenuCommand
// @require         https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @version         0.4.7.1
// @run-at          document-start
// @author          hdyzen
// @description     tweaks redgifs embed/iframe video
// @license         MIT
// ==/UserScript==

const domain = unsafeWindow.location.hostname;
const path = unsafeWindow.location.pathname;
const isIframe = unsafeWindow !== unsafeWindow.parent;
let parentDomain;

const log = (...args) => console.log("[RET]:", ...args);

const error = (...args) => console.error("[RET]:", ...args);

const click = (element, eventObj = { bubbles: true, cancelable: true }) => element?.dispatchEvent(new MouseEvent("click", eventObj));

class RedgifsTweaks {
    video;
    blacklist;
    commands = {
        autoplay: {
            label: "Autoplay",
            state: false,
            applyEffect: state => this.autoplayControl(state),
        },
        loop: {
            label: "Loop",
            state: true,
            applyEffect: state => this.loopControl(state),
        },
        volumeSlider: {
            label: "Enable volume slider",
            state: true,
            applyEffect: state => this.volumeSliderControl(state),
        },
        openLink: {
            label: "Prevent link open on click",
            state: true,
            applyEffect: state => this.openLinkControl(state),
        },
        savePrefs: {
            label: "Save prefs",
            state: true,
            applyEffect: state => this.savePrefsControl(state),
        },
        pauseVideo: {
            label: "Pause video when not visible",
            state: true,
            applyEffect: state => this.pauseVideoControl(state),
        },
        videoControls: {
            label: "Video controls",
            state: true,
            applyEffect: state => this.videoControl(state),
        },
        downloadButton: {
            label: "Download button",
            state: true,
            applyEffect: state => this.downloadButtonControl(state),
        },
        hideBloat: {
            label: "Remove bloat",
            state: false,
            applyEffect: state => this.hideBloatControl(state),
        },
    };

    async init() {
        this.blacklist = await GM.getValue("blacklist", []);

        if (domain !== "www.redgifs.com") {
            log("Running in: ", unsafeWindow.location.href);

            await this.loadCommandsExternal();
            log("Commands external initialized");

            this.sendParentDomain();
            log("Ready to sent parent domain");

            this.downloadOnTop();
            log("Ready to download on top window");

            return;
        }

        if (!path.startsWith("/ifr/")) {
            return;
        }

        console.group(unsafeWindow.location.href);
        try {
            if (isIframe) {
                await this.receiveParentDomain();
                log("Ready to receive parent domain");
            }
            log("BLACKLIST:", this.blacklist, parentDomain);
            if (this.blacklist.includes(parentDomain)) {
                log("Aborted [RET], domain in blacklist.");
                return;
            }

            this.patchJSONParse();
            log("Patched JSON.parse");

            this.video = await this.getVideo();
            log("Video initialized:", this.video);

            await tweaks.loadCommandsEmbed();
            log("Commands embed initialized:", this.commands);
        } catch (err) {
            error("Error on init video:", err);
        }
        console.groupEnd();
    }

    getVideo() {
        return new Promise((resolve, reject) => {
            const mutationsHandler = () => {
                const video = document.querySelector("video[src]:not([src=''])");

                if (video) {
                    observer.disconnect();
                    resolve(video);
                }
            };

            const observer = new MutationObserver(mutationsHandler);

            observer.observe(document.body || document.documentElement || document, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["src"],
            });

            setTimeout(() => {
                observer.disconnect();
                reject("Not possible get video after 10 seconds.");
            }, 10000);
        });
    }

    async loadCommandsEmbed() {
        const valuesLocal = Object.fromEntries(Object.entries(this.commands).map(([key, command]) => [key, command.state]));
        const valuesStored = await GM.getValues(valuesLocal);

        for (const key in this.commands) {
            // Sync local and stored
            if (Object.prototype.hasOwnProperty.call(valuesStored, key)) {
                this.commands[key].state = valuesStored[key];
            }

            const command = this.commands[key];
            const label = command.label;
            const state = !!command.state;

            if (command.applyEffect) {
                command.applyEffect(state);
                log("Applied effect:", key);
            } else {
                log("No effect:", key);
            }

            GM.registerMenuCommand(`${label}: ${state ? "ON" : "OFF"}`, () => this.onClickCommandEmbed(key, state));
        }
    }

    async loadCommandsExternal() {
        const blacklistMap = new Set(this.blacklist);
        const isBlacklisted = blacklistMap.has(domain);

        GM.registerMenuCommand(`${isBlacklisted ? "Enable" : "Disable"} for this site`, () => this.onClickCommandExternal(isBlacklisted, blacklistMap));
    }

    async onClickCommandEmbed(key, state) {
        await GM.setValue(key, !state);
        unsafeWindow.location.reload();
    }

    async onClickCommandExternal(isBlacklisted, blacklistMap) {
        if (isBlacklisted) {
            blacklistMap.delete(domain);
        } else {
            blacklistMap.add(domain);
        }

        await GM.setValue("blacklist", [...blacklistMap]);
        unsafeWindow.location.reload();
    }

    sendParentDomain() {
        let sourceParent;

        const handleDomainRequest = event => {
            if (isIframe) {
                unsafeWindow.parent.postMessage({ request: "domain" }, "*");
                sourceParent = event.source;
            } else {
                event.source.postMessage({ redgifsParentDomain: domain }, "*");
            }
        };

        const handleParentDomainMessage = event => {
            sourceParent.postMessage({ redgifsParentDomain: event.data.redgifsParentDomain }, "*");
        };

        const messageFunc = event => {
            if (event.data.request === "domain") {
                handleDomainRequest(event);
            } else if (event.data.redgifsParentDomain && sourceParent) {
                handleParentDomainMessage(event);
            }
        };

        unsafeWindow.addEventListener("message", messageFunc);
    }

    async receiveParentDomain() {
        return new Promise(resolve => {
            const messageFunc = e => {
                if (!e.data.redgifsParentDomain) return;

                parentDomain = e.data.redgifsParentDomain;
                log("Received parent domain: ", parentDomain);
                resolve();
            };

            unsafeWindow.addEventListener("message", messageFunc);
            unsafeWindow.parent.postMessage({ request: "domain" }, "*");
        });
    }

    detectButtonsClick() {
        const buttons = document.querySelector(".buttons");

        if (!buttons) {
            throw new Error("Can't detect buttons clicks, it's falsy");
        }

        buttons.onclick = ev => {
            const target = ev.target;

            console.log(target.closest(".soundOff"));

            switch (true) {
                case !!target.closest(".soundOff"):
                    localStorage.setItem("enableSound", 1);
                    break;
                case !!target.closest(".soundOn"):
                    localStorage.removeItem("enableSound");
                    break;
                case !!target.closest(".gifQuality:has([d^='M1 12C1'])"):
                    localStorage.setItem("enableHD", 1);
                    break;
                case !!target.closest(".gifQuality:has([d^='M1.16712'])"):
                    localStorage.removeItem("enableHD");
                    break;
            }
        };
    }

    autoplayControl(state) {
        this.video.autoplay = state;
    }

    loopControl(state) {
        this.video.loop = state;
    }

    volumeSliderControl(state) {
        if (!state) return;

        const volumeContainer = document.querySelector(".buttons:has(> div > .soundOff,> div > .soundOn)");
        if (!volumeContainer) return;

        const inputRange = document.createElement("input");
        this.volumeSliderControl.inputRange = inputRange;
        inputRange.type = "range";
        inputRange.min = 0;
        inputRange.max = 1;
        inputRange.step = 0.01;
        inputRange.value = +localStorage.getItem("volume");

        inputRange.oninput = e => {
            const volume = e.target.value;
            this.video.volume = volume;

            this.updateVolumeUI();
        };
        inputRange.onmouseup = e => e.stopImmediatePropagation();

        volumeContainer.appendChild(inputRange);
    }

    openLinkControl(state) {
        if (!state) return;

        this.video.parentElement.onclick = ev => ev.preventDefault();
    }

    savePrefsControl(state) {
        if (!state) return;

        const [enableHD, enableSound, volume] = [localStorage.getItem("enableHD"), localStorage.getItem("enableSound"), localStorage.getItem("volume")];

        if (enableHD) {
            click(document.querySelector(".gifQuality:has([d^='M1 12C1'])"));
        }

        if (enableSound) {
            click(document.querySelector(".soundOff"));
        }

        if (volume) {
            this.video.volume = Math.min(1, +volume);
        }

        this.detectButtonsClick();
        log("Detect buttons clicks initialized");
    }

    pauseVideoControl(state) {
        if (!state) return;

        const handleIntersection = ([entry]) => {
            if (!entry.isIntersecting) {
                this.video.pause();
            }
        };
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.8,
        });

        observer.observe(this.video);
    }

    videoControl(state) {
        if (!state) return;

        const keyActionHandler = ev => {
            const key = ev.code;
            const timeStep = ev.shiftKey ? 10 : 5;
            const volumeStep = ev.shiftKey ? 0.1 : 0.05;
            const playbackStep = 0.1;

            switch (key) {
                case "KeyF":
                    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                    break;
                case "KeyM":
                    this.video.muted = !this.video.muted;
                    break;
                case "Space":
                    this.video.paused ? this.video.play() : this.video.pause();
                    break;
                case "ArrowLeft":
                    this.video.currentTime -= timeStep;
                    break;
                case "ArrowRight":
                    this.video.currentTime += timeStep;
                    break;
                case "ArrowUp":
                    this.video.volume = Math.min(1, this.video.volume + volumeStep);
                    this.updateVolumeUI();
                    break;
                case "ArrowDown":
                    this.video.volume = Math.max(0, this.video.volume - volumeStep);
                    this.updateVolumeUI();
                    break;
                case "Minus":
                    this.video.playbackRate -= playbackStep;
                    break;
                case "Equal":
                    this.video.playbackRate += playbackStep;
                    break;
                case "Backspace":
                    this.video.playbackRate = 1;
                    break;
                case "Home":
                    this.video.currentTime = 0;
                    break;
                case "End":
                    this.video.currentTime = this.video.duration;
                    break;
            }
        };

        window.addEventListener("keydown", keyActionHandler);
    }

    downloadButtonControl(state) {
        if (!state) return;

        GM.addStyle("#downloadOpen { display: block }");
    }

    hideBloatControl(state) {
        if (!state) return;

        GM.addStyle(".userInfo, .logo, #shareButton { display: none !important; }");
    }

    async downloadAsBlob(vUrl, downloadElementEntry) {
        if (isIframe) {
            return unsafeWindow.parent.postMessage({ redgifsURL: vUrl }, "*");
        }

        try {
            const res = await GM.xmlHttpRequest({
                url: vUrl,
                responseType: "blob",
                onprogress: ev => {
                    // TODO: Adicionar um método para comunicação entre window/parent
                    if (!downloadElementEntry) return;

                    const loaded = (ev.loaded / ev.total) * 100;
                    const progress = (loaded / 100) * downloadElementEntry.offsetWidth;

                    downloadElementEntry.style.boxShadow = `${progress}px 0 0 0 rgba(192, 28, 119, 0.5) inset`;
                },
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
            error("Error downloading video:", error);
        }
    }

    addDownloadEntries(arr) {
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
                return this.downloadAsBlob(url, download);
            }

            const copy = e.target.closest(".copy-button");
            if (copy) {
                return navigator.clipboard.writeText(copy.parentElement.dataset.url);
            }
        });

        document.body.appendChild(downloadButton);
    }

    downloadOnTop() {
        const messageFunc = e => {
            if (!e.data?.redgifsURL) return;

            log("Downloading: ", e.data.redgifsURL);
            this.downloadAsBlob(e.data.redgifsURL);
        };

        unsafeWindow.addEventListener("message", messageFunc);
    }

    updateVolumeUI() {
        this.volumeSliderControl.inputRange.value = this.video.volume;
        localStorage.setItem("volume", this.video.volume);

        if (this.video.volume > 0) {
            click(document.querySelector(".soundOff"));
        } else {
            click(document.querySelector(".soundOn"));
        }
    }

    patchJSONParse() {
        const originalJParse = JSON.parse;

        JSON.parse = (text, reviver) => {
            const result = originalJParse.call(JSON, text, reviver);
            if (result.gif) {
                const urls = Object.entries(result.gif.urls);
                const ext = urls.map(([n, u]) => [`${u.split(".").at(-1)} - ${n}`, u]).sort();

                log("Creating download entries for: ", location.href);
                tweaks.addDownloadEntries(ext);
            }

            return result;
        };
    }
}

const tweaks = new RedgifsTweaks();
tweaks.init();

GM.addStyle(`
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
html:has(> head > meta[property="og:site_name"][content="RedGIFs"]) .hidden {
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
