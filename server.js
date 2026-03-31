/**
 * Phusion Passenger (cPanel Application Manager) entrypoint.
 * Passenger sets PORT; this file must exist if the panel asks for an application startup file.
 * Local dev: use `npm run dev`. Vercel: does not use this file.
 */
const http = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV === "development";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => handle(req, res))
    .listen(port, hostname, () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(`> Ready on http://${hostname}:${port}`);
      }
    });
});
