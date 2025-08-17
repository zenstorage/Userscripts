// ==UserScript==
// @name                Oráculo Tweaks
// @namespace           zen
// @description         Improve oráculo for me
// @version             1.0
// @run-at              document-start
// @match               https://oraculo.ifoodxt.com.br/*
// @require             https://update.greasyfork.org/scripts/526417/1643812/USToolkit.js
// @grant               unsafeWindow
// @grant               GM_addStyle
// @license             GPL-3.0-only
// ==/UserScript==

const onElements = new UST.OnElements({ deep: true });

onElements.per("#justification", (element) => {
    if (element.value !== "") return;
    const selection = window.getSelection().toString();

    console.log(selection);
    navigator.clipboard.writeText(selection);
    element.value = selection;
    element.focus();
});

onElements.start();
