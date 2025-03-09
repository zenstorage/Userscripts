const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("node:fs");

let countProxy = 0;
let proxys;
const config = {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
        "Cookie": 'edgebucket=K2hrpSkEKXdVGNneAZ; loid=00000000008abqxtme.2.1601432363855.Z0FBQUFBQm5vNkpTT0xVRFAwSXpQeWVYZHZfWjVJQzJxTnAxWlBOM0pLNlY1Qlotb3BxZ1JiWmxRZThKeHJySmxubDNhMlk5VzVneU1GVjFiVEk2NDQ4Sm9FM0xHbndpVUNIVHprZ0toT1BVS2M1d3BGYWlURHA2Wk83aWx6eDdDRTJvRzRXMHhvUDY; csv=2; reddit_translation_status={%22shouldDisplayCoachmark%22:true%2C%22shouldDisplayFeedbackCoachmark%22:false%2C%22coachmarkDisplayCount%22:0%2C%22showCommentTranslationModal%22:true%2C%22showPostTranslationModal%22:true%2C%22isTranslationActive%22:false}; g_state={"i_l":0}; rdt=de504ecff60fcec8ffe1746f47a2003b; session_tracker=icprcregjpkorbebmg.0.1738777179770.Z0FBQUFBQm5vNkpiMHlCVnVYb1MzOV9WM3Z3NW9iUmwxcUpQc0RsWFdVcHQzaU9fVGxUOGVYZWlnSVZ6Z0xoS3FoV3ZIUURSVEFDSklaeG4tYk5ZMGw1NVVlZzVHYXdOTXRkckRQNFZQbnR1UWJGMkEyMTNxMlFYQWRoRmZBWWVXWFBVRGxVOXlrczg; csrf_token=9c1e23e3d36b207a5dd4040a6d0b249e; token_v2=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzM4ODYzNTcwLjQyMjk4MiwiaWF0IjoxNzM4Nzc3MTcwLjQyMjk4MiwianRpIjoiai14THhqVXJzOXNTaGV3ZGpVNGprOTk0SkZ2anhRIiwiY2lkIjoiMFItV0FNaHVvby1NeVEiLCJsaWQiOiJ0Ml84YWJxeHRtZSIsImFpZCI6InQyXzhhYnF4dG1lIiwibGNhIjoxNjAxNDMyMzYzODU1LCJzY3AiOiJlSnhra2RHT3REQUloZC1GYTVfZ2Y1VV9tMDF0Y1lhc0xRYW9rM243RFZvY2s3MDdjRDRwSFA5REtvcUZEQ1pYZ3FuQUJGZ1RyVERCUnVUOW5MbTNnMmlOZTh0WXNabkNCRm13RkRya21MR3NpUVFtZUpJYXl4c21vSUxOeUZ5dXRHTk5MVDBRSnFoY01yZUZIcGMyb2JrYmk1NmRHRlc1ckR5b3NWZmwwdGpHRkxZbnhqY2JxdzJwdUM2bk1rbkxRdmtzWHZUak45VzM5dm16X1NhMEo4T0txdW1CM2hsSkNHNHNmcGltM2Q5VGs1NnRDeGExOTNxUTJ1ZDYzSzU5MWl3ME83ZWY2X2xySXhtWFkyaC1KdnQzMXktaEE0ODhMelBxQUVhczRVY1pkbVFkX2xVSFVMbWdKR01KNHRNSTVNcmwyMzhKdG12VHY4YnRFejk4TS1LbU5feldETlJ6Q2VMUXBfSDFHd0FBX184UTFlVFIiLCJyY2lkIjoiNExkSEViM0taX2toT2VQb090VWozQnd0TlRmdHpBaExoUER0ZEZvZTg3VSIsImZsbyI6Mn0.BFgNBtm6Z4ixpyyhocaZw5HObH9bK0rOcarJluko38GA9aNZFtpCPsisnlYDLXZt2qec9dYOa2DHl8cmL7kPi8GHkZJZdk3BaKY-E-iYmtxn1A161SaiyZ7jS5xiu-wyL0vC1-bJAkjnQlEVvcf1fVv1JLqpeJnfG70o08S0OsSwrS10chiQ7puvhM-L_rWla-8P2pryDja0s75QL2LZRNU5alnv9QEzhSOb3CLpPswXz57fmKzQfpVeC5-u0aQUsyvyW6I1ONFnyFmYtLQWRed0k3QdS-CYUcZRadRSj-E-1KG5zg_KkN6hrBQh3LdQVhBMhDUUyUBGtoDv9o0ZQQ; reddit_session=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml84YWJxeHRtZSIsImV4cCI6MTc1NDQxNTU2Ny45MzQ1MDYsImlhdCI6MTczODc3NzE2Ny45MzQ1MDYsImp0aSI6IjJMSTVySzVhcnJpaWRZWnFqSmNrdnlIb1pRakFLdyIsImNpZCI6ImNvb2tpZSIsImxjYSI6MTYwMTQzMjM2Mzg1NSwic2NwIjoiZUp5S2pnVUVBQURfX3dFVkFMayIsInYxIjoiNjQ5MzkxNTEyMTE4LDIwMjUtMDItMDVUMTc6Mzk6MjcsYjI0OTAyOWU2NTYzNDM3ZDQyZGJjMTgwYzU5NDc3NzA0MmJjNWIzMCIsImZsbyI6Mn0.CkPVplBNSZZlSBxFVzKgH_3lOLiTTjzSCFoIiHq-WfrlVbop188eMx5nVp0g_PThGk1B8CWEq1UX8qXGswyj8bMznZUOJfKqh_ixL9ZQVpW_LSm0IsZkwmL4r-uket4rD6-wpWy1ixEnLg1GwwTYVATnRqtNxh_xqsaTG4BQLNa39-hMdgN5KJsH4awHMrM7vYEGoF2SlbsWJW0BUfLCRzF37GOs50KuB3Zc65uxWcQGWZbkfihDYz3w9GKNBAwmQdKJ1Q4FO-fpGaIiYg-1FFVKn1-8XuBJuaE5yRrUpPAYPFJYVPzsjb8cDh2EioiLWHFOXwPTscGqQtARThq_mg; reddit_chat_view=closed',
        // "proxy": {
        //     protocol: "http",
        //     host: "8.215.108.194",
        //     port: 7777,
        // },
    },
};

async function init() {
    await fetchProxys();
    initFetch();
}
init();

const changeProxy = () => {
    countProxy++;
    const [host, port] = proxys[countProxy].split(":");

    config.headers.proxy = {
        host: host,
        port: port,
    };
};

async function fetchProxys() {
    try {
        const { data } = await axios.get("https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt");

        proxys = data.split("\n");
    } catch (error) {
        console.error("Error ao obter proxys: ", error);
    }
}

async function initFetch() {
    const lastIdCsv = await getLastItemFromCSV("urls.csv");

    fetchAndParse(`https://www.reddit.com/subreddits/?limit=120&include_over_18=on&count=100&after=${lastIdCsv}`);
}

function getLastItemFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(filePath, "id,href,isNsfw\n", (err) => {
                    if (err) {
                        console.error("Erro ao criar o arquivo:", err);
                        return reject(err);
                    }
                    console.log("Arquivo criado:", filePath);
                    resolve("");
                });
            }

            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) {
                    console.error("Erro ao ler o arquivo:", err);
                    return reject(err);
                }

                const lines = data.trim().split("\n");

                if (lines.length === 0) {
                    console.log("O arquivo está vazio.");

                    fs.writeFile(filePath, "id,href,isNsfw\n", (err) => {
                        if (err) {
                            console.error("Erro ao criar o arquivo:", err);
                            return reject(err);
                        }
                        console.log("Arquivo criado:", filePath);
                        resolve("");
                    });
                }

                const lastLine = lines[lines.length - 1];
                const columns = lastLine.split(",");
                const firstItem = columns[0];

                console.log("Primeiro item da última linha:", firstItem);
                resolve(firstItem);
            });
        });
    });
}

async function fetchAndParse(url) {
    try {
        const { data } = await axios.get(url, config);

        const $ = cheerio.load(data);

        const el = $(".thing");

        const lastId = $(el[el.length - 1]).attr("data-fullname");

        el.each((index, element) => {
            const href = $(element).find('a[href*="www.reddit.com/r/"]').attr("href");
            const id = $(element).attr("data-fullname");
            const isNsfw = $(element).find(".sr-type-icon-nsfw").length > 0;

            fs.appendFile("urls.csv", `${id},${href},${isNsfw}\n`, (err) => {
                if (err) {
                    console.error("Error appending to file:", err);
                } else {
                    console.log("Data appended successfully!", href, id, isNsfw);
                }
            });
        });

        fetchAndParse(`https://www.reddit.com/subreddits/?limit=120&include_over_18=on&after=${lastId}`);
    } catch (error) {
        const {
            status,
            statusText,
            config: { url },
        } = error.response;

        console.error("Erro ao buscar a página: ");
        console.log("Status: ", status);
        console.log("Status Text: ", statusText);
        console.log("URL: ", url);
        // changeProxy();
        // console.log("Proxy alterado: ", config.headers.proxy);
        // console.log("Tentando novamente em 10 segundos");
        console.log("Tentando novamente em 6 minutos");

        setTimeout(() => initFetch(), 360000);
    }
}
