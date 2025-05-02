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
 * Asynchronously queries the DOM for an element matching the given selector.
 * If the element is not found immediately, it will observe the DOM for changes
 * and resolve once the element is found or reject after a timeout.
 *
 * @param {string} selector - The CSS selector to query for.
 * @param {number} [timeoutSeconds=10] - The maximum time to wait for the element, in seconds.
 * @returns {Promise<Element>} A promise that resolves with the found element or rejects with a timeout error.
 */
function asyncQuerySelector(selector, timeoutSeconds = 10) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
        }

        const mutationsHandler = () => {
            const target = document.querySelector(selector);
            if (target) {
                observer.disconnect();
                resolve(target);
            }
        };

        const observer = new MutationObserver(mutationsHandler);

        observer.observe(document.body || document.documentElement || document, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            reject(`Timeout ${timeoutSeconds} seconds!`);
        }, timeoutSeconds * 1000);
    });
}
