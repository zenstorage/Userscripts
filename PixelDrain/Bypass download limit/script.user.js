// ==UserScript==
// @name                Bypass download limit
// @namespace           https://greasyfork.org/users/821661
// @match               https://pixeldrain.com/*
// @grant               none
// @version             1.0
// @author              hdyzen
// @description         17/02/2025, 17:35:25
// @license             GPL-3.0-only
// ==/UserScript==

const albumFiles = window.viewer_data.api_response.files;
