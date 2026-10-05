// Upstream de teste: devolve os headers que o nginx encaminhou e finge ser o
// Next.js (X-Powered-By), para conferirmos o que o nginx altera ou esconde.
const http = require("http");

http
  .createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Powered-By", "Next.js");
    res.end(JSON.stringify({ url: req.url, headers: req.headers }));
  })
  .listen(3000);
