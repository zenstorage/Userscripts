// ==UserScript==
// @name                Inject Stylus into shadowRoots
// @name:pt-BR          Injetar Stylus em shadowRoots
// @namespace           https://greasyfork.org/users/821661
// @version             1.1
// @description         inject styles of stylus-addon in shadowRoot
// @description:pt-BR   injeta estilos do stylus-addon em shadowRoot
// @author              hdyzen
// @run-at              document-start
// @match               https://*/*
// @grant               none
// @license             GPL-3.0-only
// ==/UserScript==

const sheet = new CSSStyleSheet();
const originalShadowRootDescriptor = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets");
const originalAttachShadow = Element.prototype.attachShadow;

function syncStyles() {
    let cssText = "";
    for (const node of document.querySelectorAll("html > style.stylus")) {
        cssText += `${node.textContent}\n`;
    }
    sheet.replaceSync(cssText);
}

Element.prototype.attachShadow = function (init) {
    const shadowRoot = originalAttachShadow.call(this, init);

    console.log(shadowRoot);
    shadowRoot.adoptedStyleSheets.push(sheet);

    return shadowRoot;
};

Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
    get() {
        return originalShadowRootDescriptor.get.call(this);
    },
    set(newSheets) {
        if (!newSheets.includes(sheet)) {
            newSheets.push(sheet);
        }

        originalShadowRootDescriptor.set.call(this, newSheets);
    },
    configurable: true,
    enumerable: true,
});

new MutationObserver(syncStyles).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
});
