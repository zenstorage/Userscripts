// ==UserScript==
// @name            USToolkit
// @namespace       https://greasyfork.org/pt-BR/users/821661
// @version         0.0.4
// @run-at          document-start
// @author          hdyzen
// @description     simple toolkit to help me create userscripts
// @license         MIT
// ==/UserScript==

/**
 * Some functions are strongly inspired by:
 * github.com/violentmonkey/
 * github.com/gorhill/uBlock/
 *
 */

(() => {
	function observer(func) {
		const observer = new MutationObserver((mut) => {
			const disconnect = func(mut);

			if (disconnect === true) {
				observer.disconnect();
			}
		});

		observer.observe(document, { childList: true, subtree: true });
	}

	function waitElement(selector, timeoutSeconds = 10) {
		return new Promise((resolve, reject) => {
			const element = document.querySelector(selector);
			if (element) {
				resolve(element);
			}

			observer(() => {
				const target = document.querySelector(selector);
				if (target) {
					resolve(target);
					return true;
				}
			});

			setTimeout(() => {
				observer.disconnect();
				reject(`[UST.waitElement] Timeout ${timeoutSeconds} seconds!`);
			}, timeoutSeconds * 1000);
		});
	}

	function matchProp(obj, propChain) {
		if (!obj || typeof propChain !== "string") {
			return;
		}

		const props = propChain.split(".");
		let current = obj;

		for (let i = 0; i < props.length; i++) {
			const prop = props[i];

			if (current === undefined || current === null) {
				return;
			}

			if (prop === "[]" && Array.isArray(current)) {
				i++;
				current = handleArray(current, props[i]);
				continue;
			}

			if ((prop === "{}" || prop === "*") && isObject(current)) {
				i++;
				current = handleObject(current, props[i]);
				continue;
			}

			current = current[prop];
		}

		return current;
	}

	function handleArray(arr, nextProp) {
		const results = arr.map((item) => getProp(item, nextProp)).filter((val) => val !== undefined);

		return results.length === 1 ? results[0] : results;
	}

	function handleObject(obj, nextProp) {
		const keys = Object.keys(obj);
		const results = keys.map((key) => getProp(obj[key], nextProp)).filter((val) => val !== undefined);

		return results.length === 1 ? results[0] : results;
	}

	function getProp(obj, prop) {
		if (obj && Object.hasOwn(obj, prop)) {
			return obj[prop];
		}

		return;
	}

	function isObject(val) {
		return Object.prototype.toString.call(val) === "[object Object]";
	}

	function getValType(val) {
		return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
	}

	function update(func, time = 250) {
		const exec = () => {
			if (func() === true) {
				return;
			}

			setTimeout(() => {
				requestAnimationFrame(exec);
			}, time);
		};

		requestAnimationFrame(exec);
	}

	function patch(owner, methodName, handler) {
		const originalMethod = owner[methodName];

		if (typeof originalMethod !== "function") {
			throw new Error(`[UST.patch] The method “${methodName}” was not found in the object "${owner}".`);
		}

		const proxy = new Proxy(originalMethod, handler);

		owner[methodName] = proxy;

		return () => {
			owner[methodName] = originalMethod;
		};
	}

	function onUrlChange(callback) {
		let previousUrl = location.href;

		const observer = new MutationObserver(() => {
			if (location.href !== previousUrl) {
				previousUrl = location.href;
				callback(location.href);
			}
		});

		observer.observe(document.body || document.documentElement || document, { childList: true, subtree: true });

		const historyHandler = {
			apply(target, thisArg, args) {
				const result = Reflect.apply(target, thisArg, args);
				setTimeout(() => {
					if (location.href !== previousUrl) {
						previousUrl = location.href;
						callback(location.href);
					}
				}, 0);
				return result;
			},
		};

		patch(history, "pushState", historyHandler);
		patch(history, "replaceState", historyHandler);
	}

	function request(options) {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				...options,
				onload: resolve,
				onerror: reject,
				ontimeout: reject,
			});
		});
	}

	function extractProps(element, propsArray) {
		const data = {};

		for (const propDefinition of propsArray) {
			const [label, valuePath] = propDefinition.split(":");

			if (valuePath) {
				data[label] = matchProp(element, valuePath);
			} else {
				data[label] = matchProp(element, label);
			}
		}
		return data;
	}

	function handleStringRule(container, rule) {
		const element = container.querySelector(rule);
		return element ? element.textContent.trim() : null;
	}

	function handleArrayRule(container, rule) {
		const [subSelector, ...propsToGet] = rule;
		if (!subSelector) {
			console.log(rule);
			throw new Error("[UST.scrape] No subselector provided as the first item in the rule");
		}
		const element = container.querySelector(subSelector);
		return extractProps(element, propsToGet);
	}

	const ruleHandlers = {
		string: handleStringRule,
		array: handleArrayRule,
	};

	function getRuleType(rule) {
		if (typeof rule === "string") return "string";
		if (Array.isArray(rule)) return "array";
		return "unknown";
	}

	function processObjectSchema(container, schema) {
		const item = {};
		for (const key in schema) {
			const rule = schema[key];
			const ruleType = getRuleType(rule);

			const handler = ruleHandlers[ruleType];
			if (handler) {
				item[key] = handler(container, rule);
				continue;
			}

			console.warn(`[UST.scrape] Rule for key “${key}” has an unsupported type.`);
		}
		return item;
	}

	function processContainer(container, schema) {
		if (Array.isArray(schema)) {
			return extractProps(container, schema);
		}

		if (isObject(schema)) {
			return processObjectSchema(container, schema);
		}

		console.warn("[UST.scrape] Invalid schema format.");
		return {};
	}

	function scrape(containerSelector, schema, scope = document) {
		const containers = scope.querySelectorAll(containerSelector);
		const results = [];
		for (const container of containers) {
			const item = processContainer(container, schema);
			results.push(item);
		}
		return results;
	}

	function queryEach(selector, func) {
		const nodes = document.querySelectorAll(selector);
		for (const node of nodes) {
			func(node);
		}
		return nodes;
	}

	window.UST = window.UST || {};

	Object.assign(window.UST, {
		observer,
		waitElement,
		matchProp,
		handleArray,
		handleObject,
		getProp,
		isObject,
		update,
		patch,
		onUrlChange,
		request,
		scrape,
		queryEach,
	});
})();
