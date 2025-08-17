// ==UserScript==
// @name                Func tests
// @namespace           https://greasyfork.org/users/821661
// @version             1.0
// @description         some tests here
// @author              hdyzen
// @noframes
// @run-at              document-start
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
// @match               *://*/*
// @match               file:///*
// @grant               unsafeWindow
// @grant               GM_addStyle
// @icon                https://www.google.com/s2/favicons?domain=https://violentmonkey.github.io/&sz=64
// @license             GPL-3.0-only
// ==/UserScript==

// const obj = { a: 10 };
// UST.safeSet(obj, "a.b", 42);
// UST.safeSet(obj, "b.a", 42);

// const obj = { user: "user_id_123" };
// UST.safeSet(obj, "user.name", "Maria", { override: false });
// console.log(obj);

const user = { details: { name: "Bia", age: 30 } };

const loggerCallback = ({ action, path, value }) => {
    const pathString = path.join(".");
    if (action === "get") {
        console.log(`[GET] Acessado '${pathString}' | Valor:`, value);
    } else if (action === "set") {
        console.log(`[SET] Alterado '${pathString}' | Novo Valor:`, value);
    }
};

const userProxy = UST.createDeepProxy(user, loggerCallback);

// Acessando e modificando
console.log(userProxy.details.name);
userProxy.details.age = 31;
