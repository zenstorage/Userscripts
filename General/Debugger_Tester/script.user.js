// ==UserScript==
// @name                Debugger_Tester
// @namespace           https://greasyfork.org/users/821661
// @match               https://*/*
// @grant               none
// @run-at              document-start
// @version             1.0
// @author              hdyzen
// @description         07/02/2025, 21:41:15
// ==/UserScript==

/**
 * Patches the CanvasRenderingContext2D's fillText method to log the text and its position before drawing it.
 *
 * This function overrides the default fillText method of the CanvasRenderingContext2D prototype.
 * It logs the text to be drawn and its coordinates to the console, then calls the original fillText method.
 *
 * @function patchCanvasText
 * @example
 * // Call this function to patch the fillText method
 * patchCanvasText();
 *
 * // Example usage after patching
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * ctx.fillText('Hello, world!', 50, 50);
 */
function patchCanvasText() {
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;

    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
        console.log(`Desenhando texto: "${text}" na posição (${x}, ${y})`);

        return originalFillText.call(this, text, x, y, maxWidth);
    };
}
// patchCanvasText();

/**
 * Patches the native JSON.parse method to log the JSON string being parsed.
 *
 * This function replaces the original JSON.parse method with a custom implementation
 * that logs the JSON string to the console before parsing it. The original JSON.parse
 * method is called internally to perform the actual parsing.
 *
 * @function patchJSONParse
 * @example
 * // Call this function to patch the JSON.parse method
 * patchJSONParse();
 *
 * // Example usage after patching
 * const obj = JSON.parse('{"key": "value"}');
 * console.log(obj);
 */
function patchJSONParse() {
    const originalJParse = JSON.parse;

    JSON.parse = function (text, reviver) {
        console.log(`[JSON]: "${text}"`);

        return originalJParse.call(this, text, reviver);
    };
}
// patchJSONParse();

/**
 * Patches the `navigator.clipboard.writeText` method to log the text being copied to the clipboard.
 *
 * This function overrides the default `writeText` method of the `navigator.clipboard` object.
 * It logs the text to the console before calling the original `writeText` method.
 *
 * @function patchWriteText
 * @example
 * // Call this function to patch the writeText method
 * patchWriteText();
 *
 * // Example usage after patching
 * navigator.clipboard.writeText('Hello, world!').then(() => {
 *     console.log('Text copied to clipboard');
 * });
 */
function patchWriteText() {
    const originalWriteText = navigator.clipboard.writeText;

    navigator.clipboard.writeText = text => {
        console.log(`[CLIPBOARD]: "${text}"`);

        return originalWriteText.call(navigator.clipboard, text);
    };
}
// patchWriteText();

/**
 * Patches the `addEventListener` method of `EventTarget` to log events when they are added and triggered.
 *
 * This function replaces the original `addEventListener` method with a wrapped version that logs the event type
 * when an event listener is added and when the event is triggered.
 *
 * @function patchddEventListener
 * @example
 * // Call this function to patch the addEventListener method
 * patchddEventListener();
 *
 * // Example usage after patching
 * document.addEventListener('click', function(event) {
 *     console.log('Document clicked');
 * });
 */
function patchddEventListener() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        console.log(`Evento adicionado: ${type}`);

        const wrappedListener = function (event) {
            console.log(`Evento acionado: ${type}`);

            listener.call(this, event);
        };

        return originalAddEventListener.call(this, type, wrappedListener, options);
    };
}

/**
 * Patches the console object to override its methods.
 *
 * This function overrides the following console methods to always return true:
 * - log
 * - error
 * - warn
 * - info
 * - debug
 * - table
 * - group
 * - groupCollapsed
 * - time
 * - assert
 * - trace
 * - clear
 */
function patchConsole() {
    const consoleMethods = ["log", "error", "warn", "info", "debug", "table", "group", "groupCollapsed", "time", "assert", "trace", "clear"];
    for (const method of consoleMethods) {
        Object.defineProperty(console, method, {
            value: () => false,
        });
    }
}
// patchConsole();
