// 1. Reaproveita o parsePropChain que já tokeniza a expressão
function parsePropChain(str) {
    const tokens = [];
    let i = 0;
    let len = str.length;

    while (i < len) {
        if (str[i] === ".") {
            i++;
            continue;
        }

        let start = i;

        // Colchetes ou chaves
        if (str[i] === "[" || str[i] === "{") {
            const open = str[i],
                close = open === "[" ? "]" : "}";
            let depth = 0;
            do {
                if (str[i] === '"' || str[i] === "'") {
                    const q = str[i++];
                    while (i < len) {
                        if (str[i] === "\\") {
                            i += 2;
                        } else if (str[i] === q) {
                            i++;
                            break;
                        } else {
                            i++;
                        }
                    }
                    continue;
                }
                if (str[i] === open) depth++;
                else if (str[i] === close) depth--;
                i++;
            } while (i < len && depth > 0);

            tokens.push(str.slice(start, i));
            continue;
        }

        // Regex literal
        if (str[i] === "/") {
            i++;
            let esc = false;
            while (i < len) {
                if (!esc && str[i] === "/") break;
                esc = str[i] === "\\" && !esc;
                i++;
            }
            i++;
            while (i < len && /[gimsuy]/.test(str[i])) i++;
            tokens.push(str.slice(start, i));
            continue;
        }

        // String literal
        if (str[i] === '"' || str[i] === "'") {
            const q = str[i++];
            while (i < len) {
                if (str[i] === "\\") {
                    i += 2;
                } else if (str[i] === q) {
                    i++;
                    break;
                } else {
                    i++;
                }
            }
            tokens.push(str.slice(start, i));
            continue;
        }

        // Identificador ou chamada de função
        while (i < len && !/[.[\]()/]/.test(str[i])) i++;
        if (str[i] === "(") {
            let depth = 0;
            do {
                if (str[i] === '"' || str[i] === "'") {
                    const q = str[i++];
                    while (i < len) {
                        if (str[i] === "\\") {
                            i += 2;
                        } else if (str[i] === q) {
                            i++;
                            break;
                        } else {
                            i++;
                        }
                    }
                    continue;
                }
                if (str[i] === "(") depth++;
                else if (str[i] === ")") depth--;
                i++;
            } while (i < len && depth > 0);
        }
        tokens.push(str.slice(start, i));
    }

    return tokens;
}

// 2. Função que monta e avalia via Function
function evaluatePropChain(obj, propPath) {
    const tokens = parsePropChain(propPath);

    // Reconstrói a expressão: identificadores recebem ponto, demais tokens são agregados
    const accessExpr = tokens.map((t) => (!t.startsWith("[") ? `.${t}` : t)).join("");

    try {
        console.log(accessExpr);
        console.log(tokens);
        return new Function("obj", `return obj${accessExpr}`)(obj);
    } catch (err) {
        console.error("Erro na avaliação via Function:", err);
        return undefined;
    }
}

function createDeepProxy(target) {
    return new Proxy(target, {
        get(obj, prop) {
            console.log(obj, prop);
            const val = Reflect.get(obj, prop);
            if (typeof val === "object" && val !== null) {
                return createDeepProxy(val);
            }
            if (typeof val === "function") {
                return (...args) => {
                    const res = val.apply(obj, args);
                    return typeof res === "object" && res !== null ? createDeepProxy(res) : res;
                };
            }
            return val;
        },
    });
}

function safeSet(obj, chain, value) {
    if (!obj || typeof chain !== "string" || chain === "") {
        return;
    }

    const props = chain.split(".");
    let current = obj;
    for (let i = 0; i < props.length; i++) {
        const prop = props[i];

        if (i === props.length - 1) {
            current[prop] = value;
            break;
        }

        const hasProp = Object.hasOwn(current, prop);
        if (hasProp) {
            current = current[prop];
            continue;
        }

        current = current[prop] = {};
    }
}

// --- Exemplo de uso:
const data = {
    user: {
        name: "Alice",
        tags: ["pop", "social", "music", "art"],
        getAddress() {
            return { city: "Caruaru", zip: 55000 };
        },
    },
};

safeSet(data, "user.alt.army", "value-test");
console.log(data);

const settings = {
    config: {
        port: 8080,
        nested: { key: "value" },
    },
    list: [1, 2, 3],
    fn(x) {
        return x * 2;
    },
};

// console.log(parsePropChain(`prop.fn("hello \\"world\\"")`));
// [ "prop", "fn(\"hello \\\"world\\\"\")" ]

// console.log(parsePropChain(`prop.fn("it\\"s a test")`));
// [ "prop", "fn(\"it\\\"s a test\")" ]

// const proxy = createDeepProxy(data);

// console.log(proxy.user.name);

// console.log(evaluatePropChain(data, "user.tags.filter(t => t === 'pop')"));

// console.log(evaluatePropChain(data, "user.name"));
// Saída: "Alice"

// console.log(evaluatePropChain(data, "user.getAddress().city"));
// Saída: "Caruaru"

// console.log(evaluatePropChain(data, "user['getAddress']((() => { console.log('Inside func') })()).zip"));
// Saída: 55000
