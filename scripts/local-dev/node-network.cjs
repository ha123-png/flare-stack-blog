// Applied only to guarded child processes. No credential values or URL queries logged.
const fs = require('node:fs');
const net = require('node:net');
const dns = require('node:dns');
const dgram = require('node:dgram');
function check(host) {
  if (!host || ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(String(host))) return;
  const message = { time: new Date().toISOString(), layer: 'node', blockedHost: String(host) };
  if (process.env.LOCAL_DEV_NETWORK_LOG) fs.appendFileSync(process.env.LOCAL_DEV_NETWORK_LOG, JSON.stringify(message) + '\n');
  throw new Error(`LOCAL ONLY: outbound connection blocked (${host})`);
}
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const pipe = typeof first === 'string' ? first : first?.path;
  if (pipe && /^\\\\/.test(pipe) && !pipe.startsWith('\\\\.\\pipe\\')) throw new Error('LOCAL ONLY: remote named pipes are disabled');
  const host = typeof first === 'object' ? first.host : typeof args[1] === 'string' ? args[1] : undefined;
  // Named pipes (used by esbuild) have no TCP host.
  check(host);
  return connect.apply(this, args);
};
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input, init) {
  check(new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname);
  return originalFetch(input, { ...init, redirect: 'manual' });
};
for (const target of [dns, dns.promises]) {
  for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCaa', 'resolveCname', 'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt', 'reverse']) {
    if (typeof target[name] !== 'function') continue;
    const original = target[name];
    target[name] = function (host, ...args) { check(host); return original.call(this, host, ...args); };
  }
}
dgram.createSocket = function () { throw new Error('LOCAL ONLY: UDP sockets are disabled'); };
if (globalThis.WebSocket) {
  const OriginalWebSocket = globalThis.WebSocket;
  globalThis.WebSocket = class LocalWebSocket extends OriginalWebSocket {
    constructor(url, ...args) { check(new URL(url).hostname); super(url, ...args); }
  };
}
