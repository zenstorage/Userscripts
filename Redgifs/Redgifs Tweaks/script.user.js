// ==UserScript==
// @name                Redgifs Tweaks
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.redgifs.com/*
// @exclude-match       https://www.redgifs.com/ifr/*
// @grant               GM_download
// @grant               GM_addStyle
// @run-at              document-start
// @version             0.4.4.1
// @author              hdyzen
// @description         tweaks for redgifs page
// @license             MIT
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/496197/Redgifs%20Tweaks.user.js
// @updateURL https://update.greasyfork.org/scripts/496197/Redgifs%20Tweaks.meta.js
// ==/UserScript==
'use strict';

const urls = {};

const downloadSVG = '<svg width="36px" height="36px" fill="#fff" style="cursor: pointer;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.625 15C5.625 14.5858 5.28921 14.25 4.875 14.25C4.46079 14.25 4.125 14.5858 4.125 15H5.625ZM4.875 16H4.125H4.875ZM19.275 15C19.275 14.5858 18.9392 14.25 18.525 14.25C18.1108 14.25 17.775 14.5858 17.775 15H19.275ZM11.1086 15.5387C10.8539 15.8653 10.9121 16.3366 11.2387 16.5914C11.5653 16.8461 12.0366 16.7879 12.2914 16.4613L11.1086 15.5387ZM16.1914 11.4613C16.4461 11.1347 16.3879 10.6634 16.0613 10.4086C15.7347 10.1539 15.2634 10.2121 15.0086 10.5387L16.1914 11.4613ZM11.1086 16.4613C11.3634 16.7879 11.8347 16.8461 12.1613 16.5914C12.4879 16.3366 12.5461 15.8653 12.2914 15.5387L11.1086 16.4613ZM8.39138 10.5387C8.13662 10.2121 7.66533 10.1539 7.33873 10.4086C7.01212 10.6634 6.95387 11.1347 7.20862 11.4613L8.39138 10.5387ZM10.95 16C10.95 16.4142 11.2858 16.75 11.7 16.75C12.1142 16.75 12.45 16.4142 12.45 16H10.95ZM12.45 5C12.45 4.58579 12.1142 4.25 11.7 4.25C11.2858 4.25 10.95 4.58579 10.95 5H12.45ZM4.125 15V16H5.625V15H4.125ZM4.125 16C4.125 18.0531 5.75257 19.75 7.8 19.75V18.25C6.61657 18.25 5.625 17.2607 5.625 16H4.125ZM7.8 19.75H15.6V18.25H7.8V19.75ZM15.6 19.75C17.6474 19.75 19.275 18.0531 19.275 16H17.775C17.775 17.2607 16.7834 18.25 15.6 18.25V19.75ZM19.275 16V15H17.775V16H19.275ZM12.2914 16.4613L16.1914 11.4613L15.0086 10.5387L11.1086 15.5387L12.2914 16.4613ZM12.2914 15.5387L8.39138 10.5387L7.20862 11.4613L11.1086 16.4613L12.2914 15.5387ZM12.45 16V5H10.95V16H12.45Z"/></svg><div class="download-progress-bar" style="position: relative; height: 2px; background: rgb(255, 255, 255, 0.2); width: 100%; opacity: 0;"></div>';

const getSound = () => localStorage.getItem('gifSound');

const getIdInChilds = node => node.closest('[id^="gif_"]').id.split('_')[1];

JSON.parse = new Proxy(JSON.parse, {
    apply(target, thisArg, argList) {
        const jsonParsed = Reflect.apply(target, thisArg, argList);
        if (jsonParsed.gifs && jsonParsed.gifs.length) {
            console.log('JSON', jsonParsed);

            jsonParsed.gifs = jsonParsed.gifs.filter(gif => !gif.hasOwnProperty('cta'));

            for (const gif of jsonParsed.gifs) {
                const id = gif.id;
                const srcs = gif.urls;

                if (id && srcs) urls[id] = srcs;
            }

            // console.log(urls);
        }

        return jsonParsed;
    },
});

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

const addButtons = node => {
    node.insertAdjacentHTML('beforeend', downloadSVG);

    const svg = node.lastElementChild.previousElementSibling;

    svg.addEventListener('click', ev => {
        try {
            const id = getIdInChilds(node);

            // console.log(id, urls[id]);

            svg.style.cursor = 'wait';
            node.lastElementChild.style.opacity = '1';
            downloadVideoAsBlob(urls[id].hd || urls[id].sd)
            // GM_download({
            //     url: urls[id].hd || urls[id].sd,
            //     name: id + '.mp4',
            //     onprogress: e => {
            //         svg.style.cursor = 'progress';
            //         node.lastElementChild.style.setProperty('--progress-bar', (e.loaded / e.total) * 100 + '%');
            //     },
            // });
        } catch (err) {
            svg.style.cursor = 'not-allowed';
            console.error('Error in get download video:', err);
        }
    });
};

const mutationsHandler = mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains('SideBar')) {
                addButtons(node);
            }

            if (node.classList && node.classList.contains('GifPreview-SideBarWrap') && node.innerHTML !== '') {
                console.log(node, mutation);
                addButtons(node.querySelector('.SideBar'));
            }
        }
    }
};

const observer = new MutationObserver(mutationsHandler);

observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
});

GM_addStyle('.topNav-wrap > :not([class]) { visibility: hidden !important; } .download-progress-bar::before { position: absolute; height: 100%; background-color: #fff; content: "" ; width: var(--progress-bar, 0%); transition: .3s ease; }');
