// ==UserScript==
// @name                Debugger_Tester
// @namespace           https://greasyfork.org/users/821661
// @match               https://*/*
// @grant               none
// @version             1.0
// @author              hdyzen
// @description         07/02/2025, 21:41:15
// ==/UserScript==

// Salva a referência original do addEventListener
// const originalAddEventListener = EventTarget.prototype.addEventListener;

// // Sobrescreve o addEventListener
// EventTarget.prototype.addEventListener = function (type, listener, options) {
//     if (type.includes("yt")) {
//         // Cria uma nova função que envolve o listener original
//         const wrappedListener = function (event) {
//             console.log(`Evento acionado: ${type}`);
//             // Chama o listener original
//             listener.call(this, event);
//         };

//         // Exibe no console a chamada do evento
//         console.log(`Evento adicionado: ${type}`);

//         // Chama a função original com o listener envolvido
//         originalAddEventListener.call(this, type, wrappedListener, options);
//     } else {
//         originalAddEventListener.call(this, type, listener, options);
//     }
// };

const originalEventTarget = unsafeWindow.EventTarget.prototype.addEventListener;

unsafeWindow.EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === "click") {
        const wrappedClick = (e) => {
            console.log(type, listener);
            listener(e);
        };

        return originalEventTarget.call(this, type, wrappedClick, options);
    }

    // Para outros tipos de eventos, chama o original normalmente
    return originalEventTarget.call(this, type, listener, options);
};
