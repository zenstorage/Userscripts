// ==UserScript==
// @name                Hide unfollowed replies (Twitter/X)
// @namespace           https://greasyfork.org/users/821661
// @match               https://x.com/*
// @grant               none
// @version             1.0
// @run-at              document-start
// @author              hdyzen
// @description         hide unfollowed replies in twitter/X
// @license             GPL-3.0-only
// ==/UserScript==

const originalJParse = JSON.parse;

JSON.parse = function (text, reviver) {
    const result = originalJParse.call(this, text, reviver);
    if (text.includes('"following":')) {
        const entries = result?.data?.threaded_conversation_with_injections_v2?.instructions?.[0]?.entries;

        if (!entries) return result;

        for (const entry of entries) {
            const replies = entry?.content?.items;

            if (!replies) continue;

            entry.content.items = replies.filter(e => e.item?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy?.following);
        }
    }

    return result;
};
