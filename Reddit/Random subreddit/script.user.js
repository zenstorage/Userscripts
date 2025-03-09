// ==UserScript==
// @name                Reddit take back random
// @name:pt-BR          Reddit pegue de volta o random
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.reddit.com/*
// @match               https://sh.reddit.com/*
// @match               https://old.reddit.com/*
// @grant               GM.xmlHttpRequest
// @run-at              document-start
// @version             1.1
// @author              hdyzen
// @description         this script simulates the "/r/random" removed from reddit
// @description:pt-br   esse script simula o “/r/random” removido do reddit
// @license             GPL-3.0-only
// ==/UserScript==

/**
 * A reference to the unsafeWindow object, which provides access to the page's window object
 * from a userscript. This allows the script to interact with the page's JavaScript context.
 *
 * @type {Window}
 */
const window = unsafeWindow;

/**
 * The hostname of the current window location.
 * @type {string}
 */
const domain = window.location.hostname;

function init() {
    main();
    patchConsoleLog();
    hideGuardModal();
}
init();

/**
 * Patches the console.log function to add a custom behavior.
 *
 * This function overrides the default console.log method to check if the first argument
 * is the string "Navigation listeners online". If it is, it adds an event listener to
 * the window's navigation object that triggers the `main` function on the "navigate" event.
 *
 * @function patchConsoleLog
 */
function patchConsoleLog() {
    const originalLog = window.console.log;

    window.console.log = function (...args) {
        const result = originalLog.apply(this, args);

        if (args[0] === "Navigation listeners online") {
            window.navigation.addEventListener("navigate", e => main());
        }

        return result;
    };
}

/**
 * Hides the guard community modal for specific subreddits.
 *
 * This function inserts a style element into the document that hides the
 * guard community modal for subreddits with the names "random" and "randnsfw".
 */
function hideGuardModal() {
    document.documentElement.insertAdjacentHTML("beforeend", `<style>guard-community-modal:is([subredditname="random"], [subredditname="randnsfw"]) { display: none !important; }</style>`);
}

/**
 * Checks if the current page is a random subreddit page.
 *
 * This function examines the current window's location pathname to determine
 * if it matches either "/r/random" or "/r/randnsfw". If it matches, it returns
 * the matched subreddit type ("random" or "randnsfw"). Otherwise, it returns null.
 *
 * @returns {string|null} The type of random subreddit page ("random" or "randnsfw"), or null if not a random page.
 */
function isRandomPage() {
    const wht = window.location.pathname.match(/^\/r\/([^\/?\s]+)/)?.[1];

    return wht === "random" || wht === "randnsfw" ? wht : null;
}

/**
 * Generates a random row number based on the specified type.
 *
 * @param {string} type - The type of row to generate. Can be 'random' or 'randnsfw'.
 * @returns {number} A random row number within the range specified for the given type.
 */
function getRandomRow(type) {
    const firstRow = {
        random: 2,
        randnsfw: 290856,
    };
    const lastRow = 330694;

    return Math.floor(Math.random() * (lastRow - firstRow[type]) + firstRow[type]);
}

/**
 * Main function to fetch a random subreddit from a Google Sheets document and redirect the user to that subreddit.
 *
 * @async
 * @function main
 * @throws Will log an error to the console if the request fails.
 */
async function main() {
    try {
        const type = isRandomPage();

        if (!type) {
            return;
        }

        const res = await GM.xmlHttpRequest({
            url: `https://docs.google.com/spreadsheets/d/1xLFbNcvpdU9j1n2fF8u2n_eGW4OekO-R2JUJb7YZxOE/gviz/tq?tq=select C limit 1 offset ${getRandomRow(type)}`,
        });

        const subreddit = res.response.match(/"v":"(.+?)"/)?.[1];

        console.log(`Random: ${subreddit}`);

        if (subreddit) {
            window.location.href = `https://${domain}/r/${subreddit}`;
        }
    } catch (err) {
        console.error(err);
    }
}
