// ==UserScript==
// @name            USToolkit
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @version         0.0.2
// @run-at          document-start
// @author          hdyzen
// @description     simple toolkit to help me
// @license         MIT
// ==/UserScript==

/**
 * A shorthand for the console.log function.
 *
 * @type {Function}
 */
const log = console.log;

/**
 * Asynchronously waits for an element to appear in the DOM that matches the given selector.
 * If the element is found immediately, it resolves the promise with the element.
 * If the element is not found immediately, it sets up a MutationObserver to watch for changes in the DOM.
 * If the element appears within 10 seconds, it resolves the promise with the element.
 * If the element does not appear within 10 seconds, it rejects the promise with a timeout error.
 *
 * @param {string} selector - The CSS selector of the element to wait for.
 * @returns {Promise<Element>} A promise that resolves with the found element or rejects with a timeout error.
 */
function asyncQuerySelector(selector) {
    return new Promise((resolve, reject) => {
        const element = unsafeWindow.wrappedJSObject.document.querySelector(selector);
        if (element) {
            resolve(element);
        }

        const mutationsHandler = () => {
            const target = unsafeWindow.wrappedJSObject.document.querySelector(selector);
            if (target) {
                observer.disconnect();
                resolve(target);
            }
        };

        const observer = new MutationObserver(mutationsHandler);

        observer.observe(document.body || document.documentElement || document, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            reject("Timeout 10 seconds");
        }, 10000);
    });
}

function exportFunctions(log, asyncQuerySelector) {
    const pageWnd = unsafeWindow.wrappedJSObject;

    exportFunction(log, pageWnd, {
        defineAs: "log",
    });

    // exportFunction(
    //     function () {
    //         const result = asyncQuerySelector();

    //         return result;
    //     },
    //     pageWnd,
    //     {
    //         defineAs: "asyncQuerySelector",
    //     }
    // );
}
exportFunctions(log, asyncQuerySelector);
