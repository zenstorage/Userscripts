// ==UserScript==
// @name                Oráculo Tweaks
// @namespace           zen
// @description         Improve oráculo for me
// @version             1.0
// @run-at              document-start
// @match               https://oraculo.ifoodxt.com.br/*
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
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
