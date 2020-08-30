const http = require('http');
const fetch = require('node-fetch');

const envViewResolver = async (_, res) => {
    const env = [];
    for (const item in process.env) {
        env.push(`${item} = ${process.env[item]}`);
    }
    res.end(env.join('\n'));
};

const loadConfig = async (_, res) => {
    const consul_url = process.env.CONSUL_URL || "localhost";
    if (consul_url === "") {
        throw new Error("Remote Config Server Doesn't Setting Now");
    }
    const response = await fetch(`http://${consul_url}:8500/v1/kv/nodeService`, { method: "GET" });
    const data = await response.json();
    const config = [];

    for (item of data) {
        if (item.Value === undefined) {
            throw new Error("뭐");
        }
        config.push(decodeBase64(item.Value));
    }
    res.end(config.join('\n'));
}

const decodeBase64 = (decoded) => Buffer.from(decoded, "base64").toString('utf-8');
const helloWorldResolver = async (_, res) => {
    res.end(`<H1>Hello World</H1>`);
}

const route = {
    '/': helloWorldResolver,
    '/env': envViewResolver,
    '/kv/view': loadConfig,
}

http.createServer((req, res) => {
    const { url } = req;
    req.on("error", (err) => {
        console.error(err);
        res.statusCode = 400;
        res.end();
    })
    const handler = route[url];
    if (handler === undefined) {
        res.statusCode = 404;
        res.end("대충 없다는 내용");
    }
    if (typeof handler === 'function') {
        res.statusCode = 200;
        handler(req, res);
    }
}).listen(80);
