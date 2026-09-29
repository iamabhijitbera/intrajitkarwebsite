#!/usr/bin/env node
/**
 * Tiny zero-dependency static file server.
 *
 *   node server.js            -> http://localhost:5500
 *   node server.js 3000       -> http://localhost:3000
 *
 * Needed because the pages load data/*.json with fetch(), which browsers
 * block on the file:// protocol.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = import.meta.dirname;
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 5500;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolve(urlPath) {
  let target = path.join(ROOT, decodeURIComponent(urlPath.split("?")[0]));
  // Never serve outside the site folder.
  if (!target.startsWith(ROOT)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  return target;
}

const server = http.createServer((req, res) => {
  const target = resolve(req.url === "/" ? "/index.html" : req.url);

  if (target && fs.existsSync(target) && fs.statSync(target).isFile()) {
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(target).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  const fallback = path.join(ROOT, "404.html");
  if (fs.existsSync(fallback)) {
    fs.createReadStream(fallback).pipe(res);
  } else {
    res.end("<h1>404 — Not found</h1>");
  }
});

server.listen(PORT, () => {
  console.log(`Debanshu static site running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});
