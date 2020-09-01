const http = require('http');
const fetch = require('node-fetch');

const envViewResolver = async (_, res) => {
    const env = [];
    for (const item in process.env) {
        env.push(`${item} = ${process.env[item]}`);
    }
    res.end(env.join('\n'));
};


const getConsulHTTPEndpoint = (url, port) => {
    if (url === undefined) return undefined;
    if (port === undefined) {
        return `http://${url}/v1/kv`;
    } else {
        return `http://${url}:${port}/v1/kv`;
    }
}

const loadConfig = async (_, res) => {
    const consulURL = getConsulHTTPEndpoint(process.env.CONSUL_URL, process.env.PORT);
    const accessToken = process.env.TOKEN;
    if (!consulURL) {
        throw new Error("Remote Config Server Doesn't Setting Now");
    }
    if (!accessToken) {
        throw new Error("X-Consul-Token doesn't Setting Now");
    }
    console.log(accessToken);
    const response = await fetch(`${consulURL}/nodeService`, { method: "GET", headers: {'X-Consul-Token': accessToken, 'Content-Type': 'application/json'}});
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
        res.setHeader("Content-Type", "text/html; charset=utf-8")
        res.end("대충 없다는 내용");
    }
    if (typeof handler === 'function') {
        res.statusCode = 200;
        handler(req, res);
    }
}).listen(80);
