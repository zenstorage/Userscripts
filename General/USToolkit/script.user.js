// ==UserScript==
// @name            USToolkit
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @version         0.0.2
// @run-at          document-start
// @author          hdyzen
// @description     simple toolkit to help me
// @license         MIT
// ==/UserScript==

function asyncQuerySelector(selector) {
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
            reject("Timeout 10 seconds");
        }, 10000);
    });
}
document.asyncQuerySelector = asyncQuerySelector;
