import fs from "node:fs";

fs.readFile("urls.csv", "utf8", (err, data) => {
    if (err) {
        console.error("Erro ao ler o arquivo:", err);
        return;
    }
    const lines = data.split("\n");

    const random = Math.floor(Math.random() * lines.length + 1);

    console.log(lines[random]);
});
