// ==UserScript==
// @name                Remove Gulf of America
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.google.com*/maps/*
// @grant               none
// @run-at              document-start
// @version             1.0
// @author              hdyzen
// @description         context: https://www.reddit.com/r/userscripts/comments/1imxwby/a_simple_userscript_that_reverts_the_gulf_of/
// ==/UserScript==

// prettier-ignore
const golfArr = [
    '(Golfo dos', // Start PT-BR
    "América)",
    "(Golfo da"   // End PT-BR
]

function replaceGolfAmerica(text) {
    return text.replace("(Golfo dos América)", "");
}

const originalFillText = CanvasRenderingContext2D.prototype.fillText;

CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
    if (golfArr.includes(text)) return;

    return originalFillText.call(this, text, x, y, maxWidth);
};

const originalJParse = JSON.parse;

JSON.parse = function (text, reviver) {
    if (text.includes("(Golfo dos América)")) {
        text = replaceGolfAmerica(text);
    }

    return originalJParse.call(this, text, reviver);
};

const originalWriteText = navigator.clipboard.writeText;

navigator.clipboard.writeText = text => {
    if (text.includes("(Golfo dos América)")) {
        text = replaceGolfAmerica(text);
    }

    return originalWriteText.call(navigator.clipboard, text);
};

// const handleMutations = mutations => {
//     for (const mutation of mutations) {
//         for (const node of mutation.addedNodes) {
//             if (node.nodeType === Node.TEXT_NODE && node.nodeName === Node.ELEMENT_NODE && node.textContent.includes("(Golfo dos América)")) {
//                 console.log(node, node.nodeValue);
//                 node.nodeValue = node.nodeValue.replace("(Golfo dos América)", "");
//             }
//         }
//     }
// };

// const observer = new MutationObserver(handleMutations);

// observer.observe(document, { childList: true, subtree: true });
