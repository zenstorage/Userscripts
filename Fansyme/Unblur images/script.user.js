// ==UserScript==
// @name                Fansyme unblur images
// @namespace           https://greasyfork.org/users/821661
// @match               https://fansyme.com/*
// @grant               none
// @version             0.0.1
// @run-at              document-start
// @require             https://update.greasyfork.org/scripts/526417/1534658/USToolkit.js
// @author              hdyzen
// @description         unblur images in fansyme (enjoy it while it lasts)
// @license             GPL-3.0-only
// ==/UserScript==

async function replaceImg(uuid, mediaUrl) {
    // if (!uuid && !mediaUrl) return;

    const postImg = await asyncQuerySelector(`[data="${uuid}"] .content-locked, .content-locked:has(> [data-mediaid="${uuid}"])`);
    // console.log(uuid, mediaUrl, postImg);

    if (postImg) {
        postImg.outerHTML = `
            <div class="no-user-select">
                <img src="${mediaUrl}" style="width: 100%">
            </div>`;
    }
}

const originalJSONParse = JSON.parse;

JSON.parse = function (text, reviver) {
    const parsed = originalJSONParse.call(this, text, reviver);
    const updates = parsed.updates;

    if (updates) {
        for (const update of updates) {
            const { uuid, mediaUrl, preview_image } = update;
            console.log(uuid, mediaUrl, update);

            replaceImg(uuid, mediaUrl.includes("blur.") ? preview_image : mediaUrl);
        }
    }

    return parsed;
};

const originalJson = Response.prototype.json;

Response.prototype.json = async function () {
    const parsed = await originalJson.call(this);
    const updates = parsed.updates;

    if (updates) {
        for (const update of updates) {
            const { uuid, mediaUrl, preview_image } = update;
            console.log(uuid, mediaUrl, update);

            replaceImg(uuid, mediaUrl.includes("blur.") ? preview_image : mediaUrl);
        }
    }

    return parsed;
};
