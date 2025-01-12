// ==UserScript==
// @name            Redgifs Embed Tweaks
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @match           https://www.redgifs.com/ifr/*
// @grant           GM_registerMenuCommand
// @grant           GM_addElement
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_download
// @version         0.3.4
// @author          hdyzen
// @description     tweaks redgifs embed/iframe video
// @license         MIT
// ==/UserScript==
'use strict';

const menu = {
    autoplay: { state: true, label: 'Autoplay' },
    openlink: { state: false, label: 'Open link when click' },
    autoPause: { state: true, label: 'Autopause' },
    muted: { state: false, label: 'Muted' },
    bloat: { state: true, label: 'Remove bloat' },
    quality: { state: true, label: 'Default HD' },
    midClick: { state: false, label: 'Middle click open ifr link' },
    bgkColorBtn: { state: false, label: 'Background color button' },
    downloadBtn: { state: false, label: 'Download button' },
    refreshBtn: { state: false, label: 'Refresh button' },
    playPauseHover: { state: false, label: 'Play/pause on hover video' },
};
const menuSaved = GM_getValue('menu', menu);
const click = new MouseEvent('click', { bubbles: true, cancelable: true });

let color = GM_getValue('bgkColor', '#0b0b28');

function commandMenu() {
    Object.keys(menu).forEach(id => {
        let { state, label } = menu[id];

        if (menuSaved[id]) {
            state = menuSaved[id].state;
            menu[id].state = menuSaved[id].state;
        }

        GM_registerMenuCommand(`${label}: ${state ? 'ON' : 'OFF'}`, () => toggleState(state, label, id), { id: id });
    });
}
commandMenu();

function addCSS(text) {
    document.documentElement.insertAdjacentHTML('beforeend', `<style rel='stylesheet'>${text}</style>`);
}

function toggleState(state, label, id) {
    menu[id].state = !state;
    GM_setValue('menu', menu);
    location.reload();
}

function preventAutoplay(video) {
    video.removeAttribute('autoplay');
    video.pause();
}

function preventOpenLink(element) {
    element.addEventListener('click', e => e.preventDefault());
}

function pauseWhenNotIntersecting(video) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => (!entry.isIntersecting && !entry.target.paused ? entry.target.pause() : undefined)), { threshold: 0.75 });
    observer.observe(video);
}

function buttonClick(button) {
    button?.dispatchEvent(click);
}

function removeBloat() {
    addCSS(`.userInfo, .logo, #shareButton{ display: none !important }`);
}

function openIfrUrl(video) {
    const link = video.parentNode;
    link.href = link.href.replace('/watch/', '/ifr/');
}

function bgkColor(buttons) {
    let pickColor = GM_addElement(buttons, 'label', { id: 'pick-color', class: 'button', title: 'Change background color', style: 'display: block;' });
    pickColor.innerHTML = `<span class="color-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="width: unset;margin: auto;" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.20348 2.00378C9.46407 2.00378 10.5067 3.10742 10.6786 4.54241L19.1622 13.0259L11.384 20.8041C10.2124 21.9757 8.31291 21.9757 7.14134 20.8041L2.8987 16.5615C1.72713 15.3899 1.72713 13.4904 2.8987 12.3188L5.70348 9.51404V4.96099C5.70348 3.32777 6.82277 2.00378 8.20348 2.00378ZM8.70348 4.96099V6.51404L7.70348 7.51404V4.96099C7.70348 4.63435 7.92734 4.36955 8.20348 4.36955C8.47963 4.36955 8.70348 4.63435 8.70348 4.96099ZM8.70348 10.8754V9.34247L4.31291 13.733C3.92239 14.1236 3.92239 14.7567 4.31291 15.1473L8.55555 19.3899C8.94608 19.7804 9.57924 19.7804 9.96977 19.3899L16.3337 13.0259L10.7035 7.39569V10.8754C10.7035 10.9184 10.7027 10.9612 10.7012 11.0038H8.69168C8.69941 10.9625 8.70348 10.9195 8.70348 10.8754Z" fill="currentColor"/><path d="M16.8586 16.8749C15.687 18.0465 15.687 19.946 16.8586 21.1175C18.0302 22.2891 19.9297 22.2891 21.1013 21.1175C22.2728 19.946 22.2728 18.0465 21.1013 16.8749L18.9799 14.7536L16.8586 16.8749Z" fill="currentColor"/></svg></span><input type="color" style="display:none">`;
    pickColor.oninput = e => {
        let color = e.target.value;
        GM_setValue('bgkColor', color);
        document.querySelectorAll('body, .App').forEach(element => element.style.setProperty('background', color, 'important'));
    };
}

async function downloadVideoAsBlob(videoUrl) {
    try {
        const response = await fetch(videoUrl);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const nameVideo = videoUrl.split('/').at(-1);

        link.href = url;
        link.download = nameVideo;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading video:', error);
    }
}

function addDownload(video) {
    try {
        const videoId = video.poster.split('/').at(-1).split('-')[0];
        const url = `https://files.redgifs.com/${videoId}.mp4`;
        console.log(video, url);
        let toLink = GM_addElement(document.body, 'a', { class: 'toLink', style: 'position: absolute;right: 1rem;bottom: 1rem;cursor:pointer;s', title: 'Download' });
        toLink.onclick = e => {
            e.preventDefault();
            // downloadVideo(url); // Not working in Firefox mobile
            downloadVideoAsBlob(url);
        };
        toLink.innerHTML = `<svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z" fill="#fff"/><path d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z" fill="#fff"/></svg>`;
    } catch (error) {
        console.error('Error in download:', error);
    }
}

function downloadVideo(url) {
    const nameVideo = url.split('/').at(-1);
    GM_download({
        url: url,
        name: nameVideo,
    });
}

function refreshButton(buttons) {
    let toRefresh = GM_addElement(buttons, 'div', { class: 'toRefresh', title: 'Refresh' });
    toRefresh.innerHTML = `<svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.06189 13C4.02104 12.6724 4 12.3387 4 12C4 7.58172 7.58172 4 12 4C14.5006 4 16.7332 5.14727 18.2002 6.94416M19.9381 11C19.979 11.3276 20 11.6613 20 12C20 16.4183 16.4183 20 12 20C9.61061 20 7.46589 18.9525 6 17.2916M9 17H6V17.2916M18.2002 4V6.94416M18.2002 6.94416V6.99993L15.2002 7M6 20V17.2916" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><script xmlns=""/></svg>`;
    toRefresh.onclick = () => window.location.reload();
}

function playHover(video) {
    video.parentNode.parentNode.addEventListener('mouseenter', e => {
        if (video.paused) video.play();
    });
    video.parentNode.parentNode.addEventListener('mouseleave', e => {
        if (!video.paused) video.pause();
    });
}

const observer = new MutationObserver(mutations => {
    const { autoplay, openlink, autoPause, muted, bloat, quality, midClick, bgkColorBtn, downloadBtn, refreshBtn, playPauseHover } = menu,
        mutedButton = document.querySelector('.soundOff'),
        qualityButton = document.querySelector('.button:has([d^="M1 12C1"])'),
        video = document.querySelector('a.videoLink video[src]:not([exist])'),
        buttons = document.querySelector('.buttons');

    if (!video) return;
    video.setAttribute('exist', '');

    if (!autoplay.state) preventAutoplay(video);
    if (!openlink.state) preventOpenLink(video.parentNode);
    if (autoPause.state) pauseWhenNotIntersecting(video);
    if (!muted.state) buttonClick(mutedButton);
    if (bloat.state) removeBloat();
    if (quality.state) buttonClick(qualityButton);
    if (midClick.state) openIfrUrl(video);
    if (bgkColorBtn.state) bgkColor(buttons);
    if (downloadBtn.state) addDownload(video);
    if (refreshBtn.state) refreshButton(buttons);
    if (playPauseHover.state) playHover(video);
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

addCSS(`body, .App.nonav{ background: ${color}; } .button > svg { margin: auto !important; & + span { line-height: 1 !important; margin-top: 5px !important; } }`);
