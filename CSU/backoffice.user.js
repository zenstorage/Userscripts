// ==UserScript==
// @name                Backoffice Tweaks
// @namespace           zen
// @description         Improve backoffice for me
// @version             1.0
// @run-at              document-start
// @match               https://backoffice.ifoodxt.com.br/*
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
// @grant               unsafeWindow
// @license             GPL-3.0-only
// ==/UserScript==

let uuidInput;
let searchButton;
let UUID;

window.addEventListener("message", (event) => {
    console.log(event);
    UUID = event.data?.UUID;
    if (!UUID) return;

    if (!uuidInput) {
        uuidInput = document.querySelector('[data-testid="input-orders"]');
    }

    if (!searchButton) {
        searchButton = document.querySelector('[data-testid="search-button"]');
    }

    console.log(UUID);
    uuidInput.value = UUID;
    searchButton.click();
});

const originalFetch = unsafeWindow.fetch;
unsafeWindow.fetch = function (url, init) {
    const result = originalFetch.call(this, url, init);

    if (UUID && url === "https://backoffice-api.ifoodxt.com.br/orders/graphql") {
        const bodyParsed = JSON.parse(init.body);
        if (bodyParsed?.variables?.id) bodyParsed.variables.id = UUID;
        init.body = JSON.stringify(bodyParsed);
        return originalFetch.call(this, url, init);
    }

    return result;
};
