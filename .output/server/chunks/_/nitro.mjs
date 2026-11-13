import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const nextChar = input[_base.length];
  if (nextChar && nextChar !== "/" && nextChar !== "?") {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = { ...defaults };
  for (const key of Object.keys(baseObject)) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _rawReqUrl = event.node.req.url || "/";
    const _reqPath = _decodePath(event._path || _rawReqUrl);
    event._path = _reqPath;
    const _needsRawUrl = _reqPath !== _rawReqUrl;
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _needsRawUrl ? layer.route.length > 1 ? _rawReqUrl.slice(layer.route.length) || "/" : _rawReqUrl : _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function _decodePath(url) {
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);
  const decodedPath = path.includes("%25") ? decodePath(path.replace(/%25/g, "%2525")) : decodePath(path);
  return decodedPath + query;
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i;
createFetch({ fetch, Headers: Headers$1, AbortController });

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r="sha256",s="base64url";function digest(t){if(e)return e(r,t,s);const o=createHash(r).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "56d6f7c3-c5e6-4d3d-a30f-19f912cb44b7",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {
    "apiBase": "https://shop-api.test/api"
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

/**
* Nitro internal functions extracted from https://github.com/nitrojs/nitro/blob/v2/src/runtime/internal/utils.ts
*/
function isJsonRequest(event) {
	// If the client specifically requests HTML, then avoid classifying as JSON.
	if (hasReqHeader(event, "accept", "text/html")) {
		return false;
	}
	return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
	const value = getRequestHeader(event, name);
	return !!(value && typeof value === "string" && value.toLowerCase().includes(includes));
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
	if (event.handled || isJsonRequest(event)) {
		// let Nitro handle JSON errors
		return;
	}
	// invoke default Nitro error handler (which will log appropriately if required)
	const defaultRes = await defaultHandler(error, event, { json: true });
	// let Nitro handle redirect if appropriate
	const status = error.status || error.statusCode || 500;
	if (status === 404 && defaultRes.status === 302) {
		setResponseHeaders(event, defaultRes.headers);
		setResponseStatus(event, defaultRes.status, defaultRes.statusText);
		return send(event, JSON.stringify(defaultRes.body, null, 2));
	}
	const errorObject = defaultRes.body;
	// remove proto/hostname/port from URL
	const url = new URL(errorObject.url);
	errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
	// add default server message (keep sanitized for unhandled errors)
	errorObject.message = error.unhandled ? errorObject.message || "Server Error" : error.message || errorObject.message || "Server Error";
	// we will be rendering this error internally so we can pass along the error.data safely
	errorObject.data ||= error.data;
	errorObject.statusText ||= error.statusText || error.statusMessage;
	delete defaultRes.headers["content-type"];
	delete defaultRes.headers["content-security-policy"];
	setResponseHeaders(event, defaultRes.headers);
	// Access request headers
	const reqHeaders = getRequestHeaders(event);
	// Detect to avoid recursion in SSR rendering of errors
	const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
	// HTML response (via SSR)
	const res = isRenderingError ? null : await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject), {
		headers: {
			...reqHeaders,
			"x-nuxt-error": "true"
		},
		redirect: "manual"
	}).catch(() => null);
	if (event.handled) {
		return;
	}
	// Fallback to static rendered error page
	if (!res) {
		const { template } = await import('./error-500.mjs');
		setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
		return send(event, template(errorObject));
	}
	const html = await res.text();
	for (const [header, value] of res.headers.entries()) {
		if (header === "set-cookie") {
			appendResponseHeader(event, header, value);
			continue;
		}
		setResponseHeader(event, header, value);
	}
	setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
	return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const plugins = [
  
];

const assets = {
  "/img.png": {
    "type": "image/png",
    "etag": "\"e98-UTEqHrlZJ0uGwb7GoKn9NJDowxM\"",
    "mtime": "2026-07-14T02:44:59.220Z",
    "size": 3736,
    "path": "../public/img.png"
  },
  "/img_1.png": {
    "type": "image/png",
    "etag": "\"11a3-3wogueWTGzd9997vJU/uxn87WZs\"",
    "mtime": "2026-07-14T02:44:59.223Z",
    "size": 4515,
    "path": "../public/img_1.png"
  },
  "/img_2.png": {
    "type": "image/png",
    "etag": "\"f3d-62eYm9CQuDcRq91ivF0Bk1Z8xEY\"",
    "mtime": "2026-07-14T02:44:59.223Z",
    "size": 3901,
    "path": "../public/img_2.png"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"3d28c-hGL4BtLFpw4Tq8o/+hcrAwq4/bs\"",
    "mtime": "2026-07-14T02:44:59.079Z",
    "size": 250508,
    "path": "../public/favicon.ico"
  },
  "/img_3.png": {
    "type": "image/png",
    "etag": "\"85f-5ZYFi/2YWxtT68xsmBQnr4wRYk8\"",
    "mtime": "2026-07-14T02:44:59.227Z",
    "size": 2143,
    "path": "../public/img_3.png"
  },
  "/img_4.png": {
    "type": "image/png",
    "etag": "\"1be82-g8ddxghAeV4U4HWmKTBxi+4RQPo\"",
    "mtime": "2026-07-14T02:44:59.233Z",
    "size": 114306,
    "path": "../public/img_4.png"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"1a-a1cIDLljyn/zLf+iveG+HSGws5Y\"",
    "mtime": "2026-07-14T02:44:59.311Z",
    "size": 26,
    "path": "../public/robots.txt"
  },
  "/logo.png": {
    "type": "image/png",
    "etag": "\"1be82-g8ddxghAeV4U4HWmKTBxi+4RQPo\"",
    "mtime": "2026-07-14T02:44:59.303Z",
    "size": 114306,
    "path": "../public/logo.png"
  },
  "/_nuxt/-nc81kif.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20c-TF9cjuVplX0fVhPuz/NXePGRYNo\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 524,
    "path": "../public/_nuxt/-nc81kif.js"
  },
  "/_nuxt/-9ph4Ns5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19d-k67g0ltkOsSNcGs9McZxyXCTbUA\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 413,
    "path": "../public/_nuxt/-9ph4Ns5.js"
  },
  "/_nuxt/0zbeL1cz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d4-SPhdhNXqEEjeLZ1NCZVXkLEryO8\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 212,
    "path": "../public/_nuxt/0zbeL1cz.js"
  },
  "/_nuxt/0QUcuW0i.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e33-geF6T6Vq/319J6nlNP96MY9RTJA\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 3635,
    "path": "../public/_nuxt/0QUcuW0i.js"
  },
  "/_nuxt/2dUxqKm1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f7-sREddY9PgC8hmFEu5TsEu1yK5X8\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 503,
    "path": "../public/_nuxt/2dUxqKm1.js"
  },
  "/_nuxt/2o7dEoRw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"24a3-PCNEL5f4AxRAkDOIyYe3EqMh5ro\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 9379,
    "path": "../public/_nuxt/2o7dEoRw.js"
  },
  "/_nuxt/32aSM568.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32cd-oxU/iHdPnhec5ylJBnsrfqfHFto\"",
    "mtime": "2026-11-13T03:45:52.689Z",
    "size": 13005,
    "path": "../public/_nuxt/32aSM568.js"
  },
  "/_nuxt/36Rs3761.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d1b-rGrOnejD3ZQeMzCD0XNYkxe0/zg\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 3355,
    "path": "../public/_nuxt/36Rs3761.js"
  },
  "/_nuxt/3FoP6Hyk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d71-ntV21guDpo3YtjCTHOXWl7PK9gI\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 3441,
    "path": "../public/_nuxt/3FoP6Hyk.js"
  },
  "/_nuxt/3P7VrPh7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d0-FLgbbCC9xbwpRM/Fs0cUkAmSfFY\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 464,
    "path": "../public/_nuxt/3P7VrPh7.js"
  },
  "/logo.svg": {
    "type": "image/svg+xml",
    "etag": "\"7d5e7-ZWy/utcqOeHBYdHlRGHxTOVYjNg\"",
    "mtime": "2026-07-14T02:44:59.311Z",
    "size": 513511,
    "path": "../public/logo.svg"
  },
  "/_nuxt/4T52EnsO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6ea-CLZmbnVchu0zK3gaFY2+nYgGeE0\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 1770,
    "path": "../public/_nuxt/4T52EnsO.js"
  },
  "/_nuxt/9SoAaarQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a0-BhwNEE8MSNhWFcuubip39XIsCB0\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 672,
    "path": "../public/_nuxt/9SoAaarQ.js"
  },
  "/_nuxt/3XJXGtJn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8643-OmDJeMybsfYMah+KT/yWlVdRq+U\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 34371,
    "path": "../public/_nuxt/3XJXGtJn.js"
  },
  "/_nuxt/a2R8sFhs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bf5-DDdYQXE0V8Iei7uhVrUh6bCEKLY\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 3061,
    "path": "../public/_nuxt/a2R8sFhs.js"
  },
  "/img_5.png": {
    "type": "image/png",
    "etag": "\"1ce657-3AqLQuZjUHZZsfxzwJ1bke63cNs\"",
    "mtime": "2026-07-14T02:44:59.295Z",
    "size": 1893975,
    "path": "../public/img_5.png"
  },
  "/images/kitchen-story.png": {
    "type": "image/png",
    "etag": "\"1ae7df-WRi7EJfZG7cz42ewG5IOe2ws5aw\"",
    "mtime": "2026-07-14T02:44:59.184Z",
    "size": 1763295,
    "path": "../public/images/kitchen-story.png"
  },
  "/_nuxt/AdminShell.BZgapPhO.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"6f2-jenfWs+cNKXxzeNxq1JHGhqlaPM\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 1778,
    "path": "../public/_nuxt/AdminShell.BZgapPhO.css"
  },
  "/_nuxt/AppBadge.DF4pLlAS.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"89-Lu5/jLDKGnIg1G4SIUHYfg050Xs\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 137,
    "path": "../public/_nuxt/AppBadge.DF4pLlAS.css"
  },
  "/_nuxt/AppModal.BPJ6lGPZ.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1ca-Dgp3FwIr7BZjc7H9i/tu+Q4xTRQ\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 458,
    "path": "../public/_nuxt/AppModal.BPJ6lGPZ.css"
  },
  "/_nuxt/B72On20-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f7-haoTZtg9YM4xV7Nw52iyQok0W3Q\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 247,
    "path": "../public/_nuxt/B72On20-.js"
  },
  "/_nuxt/AppDropdown.DHHtpKO3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"240-gubwTAXczZ8pQ6uw9SJAfrLJDxA\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 576,
    "path": "../public/_nuxt/AppDropdown.DHHtpKO3.css"
  },
  "/_nuxt/BavvpvIr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5732-cdBhL0vS9jeH4VSHnyGRi0ZUSSQ\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 22322,
    "path": "../public/_nuxt/BavvpvIr.js"
  },
  "/_nuxt/B0Etl2uE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"18e-FWEGsGHN/lNMTRjQmhdYFw4pIJs\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 398,
    "path": "../public/_nuxt/B0Etl2uE.js"
  },
  "/_nuxt/BBwVmbQ8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cdc-bt4ygKheZUG0gNfby5BZ5+gt/OQ\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 3292,
    "path": "../public/_nuxt/BBwVmbQ8.js"
  },
  "/_nuxt/BEb7Feuf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"236c-mZo9Fc4+OHgkWN9HnAPG04NWRGU\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 9068,
    "path": "../public/_nuxt/BEb7Feuf.js"
  },
  "/_nuxt/Be12K7eX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ab-MH2jtE0Y5OJ/1wA+GyYKc9sUetg\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 939,
    "path": "../public/_nuxt/Be12K7eX.js"
  },
  "/_nuxt/BfvIlVW1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"240-m8Ji0QN89nrSO+H/ZooTMUxdjJ4\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 576,
    "path": "../public/_nuxt/BfvIlVW1.js"
  },
  "/_nuxt/BgD1uQXJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e5e-kU0pfPRDcJC4ifD2HFqy0BsGD5w\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 3678,
    "path": "../public/_nuxt/BgD1uQXJ.js"
  },
  "/_nuxt/BeCREzG5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b0b-qEFu5+F2f36vCItf95hBsTFor8I\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 11019,
    "path": "../public/_nuxt/BeCREzG5.js"
  },
  "/_nuxt/BhBljQoq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16c-vlYO1mWKv5efcX8VzHG9O4u0WWE\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 364,
    "path": "../public/_nuxt/BhBljQoq.js"
  },
  "/_nuxt/BI4D7h47.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fee-x6FUs2NB38ySLDI/E5ZpaVA86Mc\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 4078,
    "path": "../public/_nuxt/BI4D7h47.js"
  },
  "/_nuxt/BiNVbUxE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34ca-SGHxF9Q8niVl36hU/pVZf++Lxwk\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 13514,
    "path": "../public/_nuxt/BiNVbUxE.js"
  },
  "/_nuxt/BjhjujSI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b6-Z9t70d13owj8ezIMbTiimzfJlxc\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 438,
    "path": "../public/_nuxt/BjhjujSI.js"
  },
  "/_nuxt/Bl2oPLeV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"359c-VyD8rsJl8qLJZbBv5fr2ZGLtNvo\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 13724,
    "path": "../public/_nuxt/Bl2oPLeV.js"
  },
  "/_nuxt/BLdAvRqU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"91-j2Gsg7hrU9ScJrM8I06acnbaC9U\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 145,
    "path": "../public/_nuxt/BLdAvRqU.js"
  },
  "/_nuxt/BnHNMF3F.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"de2-lWdNRLDTvjSHfU9MS/82YH8OnKE\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 3554,
    "path": "../public/_nuxt/BnHNMF3F.js"
  },
  "/_nuxt/BnHq_xpV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9d-CfOTkfojnqKoK1lJtzHyMBelg0g\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 157,
    "path": "../public/_nuxt/BnHq_xpV.js"
  },
  "/_nuxt/Bo3_L2J2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"74-0699HoMG9yx5bSruGoHDNTSm/bM\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 116,
    "path": "../public/_nuxt/Bo3_L2J2.js"
  },
  "/_nuxt/BNyLIAJe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14a-Vn0edPVGVHKfJAQFc7barMQ4gu0\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 330,
    "path": "../public/_nuxt/BNyLIAJe.js"
  },
  "/_nuxt/BP9h5MAJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"195-nS7AAyprUg4469sQX+J+b3JZfrs\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 405,
    "path": "../public/_nuxt/BP9h5MAJ.js"
  },
  "/_nuxt/BQaLf0wq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c7c-Y1U/PljZ4rQ2MMkEvFasdxdDAH4\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 11388,
    "path": "../public/_nuxt/BQaLf0wq.js"
  },
  "/_nuxt/BqgoK1J4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1de1-MjCOoIJ8O0iIkIExPRWpO1ClIk4\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 7649,
    "path": "../public/_nuxt/BqgoK1J4.js"
  },
  "/_nuxt/BrfbQMjg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"216-2KgK+osJrZK+hn5Yw5hokyfZtYc\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 534,
    "path": "../public/_nuxt/BrfbQMjg.js"
  },
  "/_nuxt/Buersq4I.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fa-DvU5GqKi5XhGYTbgI9yqpxRAMWw\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 250,
    "path": "../public/_nuxt/Buersq4I.js"
  },
  "/_nuxt/Bw2BCmjz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"644-wvXc7SSSCnKXyGtk6WhsQewhuEk\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 1604,
    "path": "../public/_nuxt/Bw2BCmjz.js"
  },
  "/_nuxt/Bwj2zqKF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"487-Z7K/g5ucwT9Ty5lkZ2X1xTu9vbM\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 1159,
    "path": "../public/_nuxt/Bwj2zqKF.js"
  },
  "/_nuxt/BwdDRh5P.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2681-c7l2+8jP2Vd6Uv4JO+Ztqxo8vOc\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 9857,
    "path": "../public/_nuxt/BwdDRh5P.js"
  },
  "/_nuxt/BUOoWbko.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"43fc-dOrX79N1bjqK5YrtHdaNCgIDyXw\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 17404,
    "path": "../public/_nuxt/BUOoWbko.js"
  },
  "/_nuxt/BWx_13u-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7b0-+rwMb3IK3cqFfAW2FBsJXV8SDSY\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 1968,
    "path": "../public/_nuxt/BWx_13u-.js"
  },
  "/_nuxt/BwJEO9nc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"386f-qoLF0Jxiwev3cq8Oq6rKVJ7YDjs\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 14447,
    "path": "../public/_nuxt/BwJEO9nc.js"
  },
  "/_nuxt/BxeG5Taw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e6-nezpOgcVv37iz0D4mQUzA45eejY\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 486,
    "path": "../public/_nuxt/BxeG5Taw.js"
  },
  "/_nuxt/BXYSq45M.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"af9-3h7w+d2wmkcTaNAj7HhJ2ZuRsT8\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 2809,
    "path": "../public/_nuxt/BXYSq45M.js"
  },
  "/_nuxt/BY55CEKd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"95e-wu+tMm4om87HNdTqlhUxYNf9O7k\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2398,
    "path": "../public/_nuxt/BY55CEKd.js"
  },
  "/_nuxt/Bz00nLmv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20bf-LuwIqpOkn9l74RbgKZZFvjsgBUM\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 8383,
    "path": "../public/_nuxt/Bz00nLmv.js"
  },
  "/_nuxt/BY21Jsj8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"857-ug+O86g3UbL5pOUjZbfuwHeTkys\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 2135,
    "path": "../public/_nuxt/BY21Jsj8.js"
  },
  "/_nuxt/BZ9LAe3o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"411-6TL+mdBgM3B36+afxZAwA9HnFmQ\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 1041,
    "path": "../public/_nuxt/BZ9LAe3o.js"
  },
  "/_nuxt/Bzj1zzaG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2155-pt24CQZ1OaYp4GbmFjSIN+HrqAc\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 8533,
    "path": "../public/_nuxt/Bzj1zzaG.js"
  },
  "/_nuxt/C2_Y9MpT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2db-FCsYBBWbM1xmsATUby8GuO3l0Tk\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 731,
    "path": "../public/_nuxt/C2_Y9MpT.js"
  },
  "/_nuxt/C2wn0i2G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a1-AUmxkVNvl4m047vhnQwI/cubkes\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 673,
    "path": "../public/_nuxt/C2wn0i2G.js"
  },
  "/_nuxt/C43L-18Y.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"330-WJbGX1ZWWyMUoIKMxHaUe4zAJ+E\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 816,
    "path": "../public/_nuxt/C43L-18Y.js"
  },
  "/_nuxt/C7uIDNNQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"42e-6uewCWrdkhuc0RWsKwKemZggyaw\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 1070,
    "path": "../public/_nuxt/C7uIDNNQ.js"
  },
  "/_nuxt/C89NJTj3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a5d-vx8hz2oZ1NzWtnAltrawpBbz0XM\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 10845,
    "path": "../public/_nuxt/C89NJTj3.js"
  },
  "/_nuxt/C8sij7Uz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a0-CiowtQ1ee7wLaAlP6JWk6rP6coQ\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 416,
    "path": "../public/_nuxt/C8sij7Uz.js"
  },
  "/_nuxt/BWG1qc-m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8c00f-XZvAK/nmIVpSHPDsLk2GQjkll5g\"",
    "mtime": "2026-11-13T03:45:52.697Z",
    "size": 573455,
    "path": "../public/_nuxt/BWG1qc-m.js"
  },
  "/_nuxt/C8ZZ8w6D.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d96-X5/cpR7cDhoHWh/WOi3+A58A7IA\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 3478,
    "path": "../public/_nuxt/C8ZZ8w6D.js"
  },
  "/_nuxt/CA6T3siE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"575-mo2F3fKjhnDNjYv7HPmLyofIJUY\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1397,
    "path": "../public/_nuxt/CA6T3siE.js"
  },
  "/_nuxt/CBV7LO4A.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"391-iO1NVvzB6BfZVyr3FPbaFg8BQrE\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 913,
    "path": "../public/_nuxt/CBV7LO4A.js"
  },
  "/_nuxt/CCALj-Je.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b8-hZ4bVq/ukq+Y1oVmx2Z7aVz3SXM\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 184,
    "path": "../public/_nuxt/CCALj-Je.js"
  },
  "/_nuxt/CcF6SOrX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"159-5S7fLVS2jvBKhbwYebooboWKp7c\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 345,
    "path": "../public/_nuxt/CcF6SOrX.js"
  },
  "/_nuxt/CDfk7HjP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f-l6cLJVYU9anew42kzoQQYXsaF6k\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 319,
    "path": "../public/_nuxt/CDfk7HjP.js"
  },
  "/_nuxt/CE8MD0bg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14d2-wu45xVEgz80TxP1eSi9oGITfZOQ\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 5330,
    "path": "../public/_nuxt/CE8MD0bg.js"
  },
  "/_nuxt/Ce99_rqi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fe-DJa1hUfMTl1b8sF1y0Um3+NRD5U\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1022,
    "path": "../public/_nuxt/Ce99_rqi.js"
  },
  "/_nuxt/CeBMrvg1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9d-uCCWKlW4UwxYxvZG0NdQslduEUs\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 157,
    "path": "../public/_nuxt/CeBMrvg1.js"
  },
  "/_nuxt/CeJ3UWfU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7a-mpUtwfwU+tEmzfk4USOo0W+fRxI\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 122,
    "path": "../public/_nuxt/CeJ3UWfU.js"
  },
  "/_nuxt/CefzYP4L.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"286b-TFMYoSDBtDd8ELlkOnY0gbvioEI\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 10347,
    "path": "../public/_nuxt/CefzYP4L.js"
  },
  "/_nuxt/CFEk5Jm1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f4-t0RtABOvFMYb18qbQ8VMXFlIdKU\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 244,
    "path": "../public/_nuxt/CFEk5Jm1.js"
  },
  "/_nuxt/CExcdRJC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"42fd-64ka1/0SkrFF1lH0AJCp9Lzj9z0\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 17149,
    "path": "../public/_nuxt/CExcdRJC.js"
  },
  "/_nuxt/CfHJU66p.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f8-MiAYW1b+qgfOirB71th5ov+Nhdk\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 248,
    "path": "../public/_nuxt/CfHJU66p.js"
  },
  "/_nuxt/CFQA6q7A.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"197-nrvpYbhmPrjNhMetQ796ZdJbNvo\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 407,
    "path": "../public/_nuxt/CFQA6q7A.js"
  },
  "/_nuxt/CHQngsPQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11a-76Lu3tWJJSXlXwot2xLcnQx7v6Q\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 282,
    "path": "../public/_nuxt/CHQngsPQ.js"
  },
  "/_nuxt/Ci6OiQys.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"101-Ps2YNGbOYfGIdgV6FalKmQnzv+c\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 257,
    "path": "../public/_nuxt/Ci6OiQys.js"
  },
  "/_nuxt/CHu1R5FZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ad-UXp970MrxAKkcbgN0kLb8+ypGMU\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 173,
    "path": "../public/_nuxt/CHu1R5FZ.js"
  },
  "/_nuxt/CI7tINQc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4aa-PBDq1qxVo+WBoZYXUHgpCsPfH3g\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 1194,
    "path": "../public/_nuxt/CI7tINQc.js"
  },
  "/_nuxt/CiN-mrZ6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"555-FsVigkHjWPHFw01FSeaUD5TLy4s\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1365,
    "path": "../public/_nuxt/CiN-mrZ6.js"
  },
  "/_nuxt/CJLWr6NK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e9-JP9ez+fbZV8qLIAmYORTY2V9fR4\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 233,
    "path": "../public/_nuxt/CJLWr6NK.js"
  },
  "/_nuxt/Ck2ecNQL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2d3-6v2NZcvNKQlvHDKTCx14sUlQLCI\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 723,
    "path": "../public/_nuxt/Ck2ecNQL.js"
  },
  "/_nuxt/CKplL_gI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cd-lg7Ef4SJnx0XdSKv5MZQup3jm/U\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 205,
    "path": "../public/_nuxt/CKplL_gI.js"
  },
  "/_nuxt/CKtYGjIN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ecf-Qlfw+oGwjShJfl+lV2+8ZbQJM28\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 3791,
    "path": "../public/_nuxt/CKtYGjIN.js"
  },
  "/_nuxt/CM9JxzPY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7de5-Hwt1o5/poHmKg1te2yaUU3pDFr4\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 32229,
    "path": "../public/_nuxt/CM9JxzPY.js"
  },
  "/_nuxt/CMDWsS_G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13e-1SfDvzuq4TZnHmVbcVNplIOFtpk\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 318,
    "path": "../public/_nuxt/CMDWsS_G.js"
  },
  "/_nuxt/CmWRZRUL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ea-uLqlfA71nsTS0q5FksJ0/ueuqmM\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 490,
    "path": "../public/_nuxt/CmWRZRUL.js"
  },
  "/_nuxt/CNBBtULM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9f-Zr/cEHpI9gtFr/qdp6MF0UvC/Wo\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 159,
    "path": "../public/_nuxt/CNBBtULM.js"
  },
  "/_nuxt/CnIcCnf2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e4-0u++BPVCFy7lS9QvtZfrT2rrHn0\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 228,
    "path": "../public/_nuxt/CnIcCnf2.js"
  },
  "/_nuxt/CNJo7vLE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"eba-l1j8JqQwjqlCUrsW0EMm5eeLHEo\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 3770,
    "path": "../public/_nuxt/CNJo7vLE.js"
  },
  "/_nuxt/Co6gyI8H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5154-7XHLFgmyI+v0k+CROxJ5dcIIoUc\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 20820,
    "path": "../public/_nuxt/Co6gyI8H.js"
  },
  "/_nuxt/Co6JQd5K.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dd-GzZlPQFlNQQuW0gCF8/lPHjOmRc\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 221,
    "path": "../public/_nuxt/Co6JQd5K.js"
  },
  "/_nuxt/CoBK7YrF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"de-VRQtfrdtcDaAYuCl8j9rcYijxOs\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 222,
    "path": "../public/_nuxt/CoBK7YrF.js"
  },
  "/_nuxt/Coig88RS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cee-KAvyqpaLJSA7J7cp61/Oyzeesp8\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 3310,
    "path": "../public/_nuxt/Coig88RS.js"
  },
  "/_nuxt/COnecbXk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"49c4-iEb/lH79Z3lgqXS4YO9/so0cwCU\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 18884,
    "path": "../public/_nuxt/COnecbXk.js"
  },
  "/_nuxt/ConfirmDialog.BbjANRRY.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2c9-h//hsYRml3nqOyvUOveTcZz0xD4\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 713,
    "path": "../public/_nuxt/ConfirmDialog.BbjANRRY.css"
  },
  "/_nuxt/COUafEMW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"860-a/pK7nOz6sdND4TInsI2XkaJIMI\"",
    "mtime": "2026-11-13T03:45:52.689Z",
    "size": 2144,
    "path": "../public/_nuxt/COUafEMW.js"
  },
  "/_nuxt/COxTnKnT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3e9-QvuQ+4dOA6d6QColhdUaVZZwiIY\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 1001,
    "path": "../public/_nuxt/COxTnKnT.js"
  },
  "/_nuxt/CoVSnjtM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e6-LL1zlVvhTK6BDvWLoC9YeGmUNTw\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 230,
    "path": "../public/_nuxt/CoVSnjtM.js"
  },
  "/_nuxt/Cp4EGXd8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a3-cBrWPtnKlFRRTm206lYcw4uGqVE\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 675,
    "path": "../public/_nuxt/Cp4EGXd8.js"
  },
  "/_nuxt/CQ6txWl7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13a-IeY+IkPnPm31xqw6bT4BPMdVQd4\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 314,
    "path": "../public/_nuxt/CQ6txWl7.js"
  },
  "/_nuxt/CQRw0A7k.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"636-gKD6kDI3upWQAFHAE0T2xtul6VU\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1590,
    "path": "../public/_nuxt/CQRw0A7k.js"
  },
  "/_nuxt/CPHe91CT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12a-f/C1cEO47b4u4SCMa6B+R6nO8UU\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 298,
    "path": "../public/_nuxt/CPHe91CT.js"
  },
  "/_nuxt/Cr2xR8_d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"730-VyfvHVWC6wrK/RjM29mGiDRHt94\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1840,
    "path": "../public/_nuxt/Cr2xR8_d.js"
  },
  "/_nuxt/CSZXTnbE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"543-6xqkI42S3zEBf89kaxtWBezHs8M\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 1347,
    "path": "../public/_nuxt/CSZXTnbE.js"
  },
  "/_nuxt/Cu2B-G4m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fa5-TS3Fu+l/BX6UPfbTbhMfbbLlwHA\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 16293,
    "path": "../public/_nuxt/Cu2B-G4m.js"
  },
  "/_nuxt/Cu48SDB0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ec0-s/2pYY1eB7/5jEKDa3USrQ4FhxU\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 16064,
    "path": "../public/_nuxt/Cu48SDB0.js"
  },
  "/_nuxt/CvEj-mzG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f0-tIkRlAWl8RbNg6vfA1LxI6Wky5Y\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 240,
    "path": "../public/_nuxt/CvEj-mzG.js"
  },
  "/_nuxt/CvuWELg5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5574-9UvGuxCUFmKfj/UQ4E1J5UXBAAA\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 21876,
    "path": "../public/_nuxt/CvuWELg5.js"
  },
  "/_nuxt/CWbQ52_J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a6-GsuuFnJAYpV3mFJM8W87RxMaeec\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 422,
    "path": "../public/_nuxt/CWbQ52_J.js"
  },
  "/_nuxt/CXhoRF-g.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11c-4tYuMvPewzZv8ZtqikjlbWfy0uU\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 284,
    "path": "../public/_nuxt/CXhoRF-g.js"
  },
  "/_nuxt/Cxinjyc9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5fc-je9Twvn694164gF89PMLtcHZN4c\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 1532,
    "path": "../public/_nuxt/Cxinjyc9.js"
  },
  "/_nuxt/CZQK95Kp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7a-2EFtrhhZ0pEIGVih/tZYcXfB2r0\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 122,
    "path": "../public/_nuxt/CZQK95Kp.js"
  },
  "/_nuxt/CZRcUO_p.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"117-XyTXf6Oaq5XIYwqazb1ZX3txzB8\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 279,
    "path": "../public/_nuxt/CZRcUO_p.js"
  },
  "/_nuxt/CzsGl7me.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7b1-uewXk2EF4vmHZDO/G7GOfXnj55E\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 1969,
    "path": "../public/_nuxt/CzsGl7me.js"
  },
  "/_nuxt/C_UMJ6Xh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23ed-90oA7dlfzoadCeWWfb9QJ3T31TI\"",
    "mtime": "2026-11-13T03:45:52.689Z",
    "size": 9197,
    "path": "../public/_nuxt/C_UMJ6Xh.js"
  },
  "/_nuxt/D0sJPAnV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"235-67Jgq0DOJQq2DIIKEc3k7MarrEY\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 565,
    "path": "../public/_nuxt/D0sJPAnV.js"
  },
  "/_nuxt/D1EBMCcK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"179-bmK58be7TTgqsRLpvi7n9movc9g\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 377,
    "path": "../public/_nuxt/D1EBMCcK.js"
  },
  "/_nuxt/D1GnIjmX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"129-OlDui8ITc1FN5v4SDqDNl4yO9UY\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 297,
    "path": "../public/_nuxt/D1GnIjmX.js"
  },
  "/_nuxt/D6ntZAio.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"139-xsGKP7H7AOVghI+9LGIZB9d57DI\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 313,
    "path": "../public/_nuxt/D6ntZAio.js"
  },
  "/_nuxt/D4EAn30G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40e20-HZIndxM6n4ucgFQ/Luv1uzjrdKo\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 265760,
    "path": "../public/_nuxt/D4EAn30G.js"
  },
  "/_nuxt/D7uIF_tF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6244-KN1c6bFBkPrCBe+ub9d4le6g8WI\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 25156,
    "path": "../public/_nuxt/D7uIF_tF.js"
  },
  "/_nuxt/D6nvxfYT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12e-r639QR/WIDa7G9VEemlBfOSIihM\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 302,
    "path": "../public/_nuxt/D6nvxfYT.js"
  },
  "/_nuxt/D8_tR-fA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ba-JmqXzzKDVCCuL0RTNrNSXPmMta0\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 442,
    "path": "../public/_nuxt/D8_tR-fA.js"
  },
  "/_nuxt/DaCsq6EC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15b-yzAS39mJmNq6TSbQrF+qCcF4q8w\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 347,
    "path": "../public/_nuxt/DaCsq6EC.js"
  },
  "/_nuxt/DAJuBlII.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29ba-o9GVNqmoy/Z4FZ8p+1t1Y4jT8kE\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 10682,
    "path": "../public/_nuxt/DAJuBlII.js"
  },
  "/_nuxt/DBKSYNVf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b7-PZJyv0tV1C0xqi+/c0TwkCXKzY4\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 183,
    "path": "../public/_nuxt/DBKSYNVf.js"
  },
  "/_nuxt/DataTable.kzhnYR-K.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"366-23Bn8Kg8aJC/WiUofs18DLY5k+E\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 870,
    "path": "../public/_nuxt/DataTable.kzhnYR-K.css"
  },
  "/_nuxt/DbqidMBo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33d-SBQHMt3zORiNpkUI34K83e+xpF4\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 829,
    "path": "../public/_nuxt/DbqidMBo.js"
  },
  "/_nuxt/Db_NKu_v.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"237-3q0+/KJs1Sg3J8PNiYL0XhGjdeE\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 567,
    "path": "../public/_nuxt/Db_NKu_v.js"
  },
  "/_nuxt/Des8tOWn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4f29-tcFyKM1JMGo+t/+P6yluq8WW6qE\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 20265,
    "path": "../public/_nuxt/Des8tOWn.js"
  },
  "/_nuxt/default.CX0wSgHV.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"31f-oWJmRR+DTOZp58by7RIndKNQl7M\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 799,
    "path": "../public/_nuxt/default.CX0wSgHV.css"
  },
  "/_nuxt/DDuM3bcU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2211-VjYM7IIj9ej1fi1qngdYdnBz8LM\"",
    "mtime": "2026-11-13T03:45:52.689Z",
    "size": 8721,
    "path": "../public/_nuxt/DDuM3bcU.js"
  },
  "/_nuxt/DFcXesa7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2f0-hoYF9M3NWgkoCNZAombmWRa7bmQ\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 752,
    "path": "../public/_nuxt/DFcXesa7.js"
  },
  "/_nuxt/Dff2lW95.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"163-I454KWhlDJbJ4/K48CWo4OTqqdY\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 355,
    "path": "../public/_nuxt/Dff2lW95.js"
  },
  "/_nuxt/DftgxTRb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"193-r4Cg/hQGDqP2Y+zIj77tT4rrDmM\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 403,
    "path": "../public/_nuxt/DftgxTRb.js"
  },
  "/_nuxt/DGhRglI0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"de-L9EVxKhcBoznSS2g57cPIgf9Q60\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 222,
    "path": "../public/_nuxt/DGhRglI0.js"
  },
  "/_nuxt/DglFJ7ow.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"280-Z35R8kd21Vc+3jSp2bV3Me4weRE\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 640,
    "path": "../public/_nuxt/DglFJ7ow.js"
  },
  "/_nuxt/DH_aOsUH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11a-3RZZq84Y8BCLmvAsegGWOQkYrho\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 282,
    "path": "../public/_nuxt/DH_aOsUH.js"
  },
  "/_nuxt/DiWKwxGK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14f0-/BQB+5S7s+mvIF0dBSuDBwaXV94\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 5360,
    "path": "../public/_nuxt/DiWKwxGK.js"
  },
  "/_nuxt/DJ-UA0YK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a1-Kh/aSz9lTXyi2DHEVT5bTRjCvRA\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 161,
    "path": "../public/_nuxt/DJ-UA0YK.js"
  },
  "/_nuxt/DJM-ZXdq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"37d-5zfzL1eSfyqy7AcuEbifDKsGo0A\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 893,
    "path": "../public/_nuxt/DJM-ZXdq.js"
  },
  "/_nuxt/DJ7G0wIV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33b5-3IXXxZqifOJqJqGkd4cTEC3M59w\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 13237,
    "path": "../public/_nuxt/DJ7G0wIV.js"
  },
  "/_nuxt/DKQvyRih.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"860-6GYBsb8dfwmud004vkR7vf7jEGs\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2144,
    "path": "../public/_nuxt/DKQvyRih.js"
  },
  "/_nuxt/DMoX1LNs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1df-MAS0w4kkX9cuHSElQhJmMSlj3Rg\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 479,
    "path": "../public/_nuxt/DMoX1LNs.js"
  },
  "/_nuxt/DlneStjX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"111-rs5NW9/NcawD9mc69e+7moH8hdg\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 273,
    "path": "../public/_nuxt/DlneStjX.js"
  },
  "/_nuxt/DmWSb2uc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"48b-/8PNAdXTy/JiqjHwKCDtXFbYX0s\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 1163,
    "path": "../public/_nuxt/DmWSb2uc.js"
  },
  "/_nuxt/Do3yno61.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"731c-+2NZqJaiApVkNwlgdUfJK+jewXI\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 29468,
    "path": "../public/_nuxt/Do3yno61.js"
  },
  "/_nuxt/DOE5pZfb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9eb-fBYWdlvnIyLLtDh8bXID1JVfgDY\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2539,
    "path": "../public/_nuxt/DOE5pZfb.js"
  },
  "/_nuxt/Dq5PaFxG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1cf-quhO2ei7lp+7m51UDctLLoh+Uoc\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 463,
    "path": "../public/_nuxt/Dq5PaFxG.js"
  },
  "/_nuxt/DPi0hVTW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"860-P3xKRIP1m7Ygjw7IVNTOItYifzE\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2144,
    "path": "../public/_nuxt/DPi0hVTW.js"
  },
  "/_nuxt/DPgh-cmQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"101-22DQZaoktx+plfiEeRojKjHSTIU\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 257,
    "path": "../public/_nuxt/DPgh-cmQ.js"
  },
  "/_nuxt/DsJHDxYA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"79f4-yVmKXp7ToI+H73huEXedkwRMCzE\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 31220,
    "path": "../public/_nuxt/DsJHDxYA.js"
  },
  "/_nuxt/DSM9dIha.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"da-LxPmvPOcfhpsylUDqjl4b3r3wO4\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 218,
    "path": "../public/_nuxt/DSM9dIha.js"
  },
  "/_nuxt/DuAb7aRj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2fa9-b5mGJ2ZcjY4884EfJMWXKiXgIjw\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 12201,
    "path": "../public/_nuxt/DuAb7aRj.js"
  },
  "/_nuxt/DwAibIQE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14c-P4BRr6qR8D2hRJBEvGHk70ZSjsw\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 332,
    "path": "../public/_nuxt/DwAibIQE.js"
  },
  "/_nuxt/DUP_Bppf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15b-wWNnLHjb6r40k64xw20nnwWL9vU\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 347,
    "path": "../public/_nuxt/DUP_Bppf.js"
  },
  "/_nuxt/DwMvniJh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17d3-MAAcdbKQODsg4zdkAtIc1/7b+iA\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 6099,
    "path": "../public/_nuxt/DwMvniJh.js"
  },
  "/_nuxt/Dwsm8nov.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"88d-zR2Ry1vUzIKIGuc+zctDJxrzoXM\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 2189,
    "path": "../public/_nuxt/Dwsm8nov.js"
  },
  "/_nuxt/DWVjfQ_y.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"127-JaM6p5BUUBOMQ2782uoxEmSAIvI\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 295,
    "path": "../public/_nuxt/DWVjfQ_y.js"
  },
  "/_nuxt/DxQ9fBXb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ae-b7+KpzK3iQeQYMawn8vN+I5o+Vk\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 174,
    "path": "../public/_nuxt/DxQ9fBXb.js"
  },
  "/_nuxt/Dz0N7iDK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2da5-ll8NPF3dJ9TeGcZefrF1CIRJWwY\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 11685,
    "path": "../public/_nuxt/Dz0N7iDK.js"
  },
  "/_nuxt/DZhHkuk_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"140-CEKBIKFUhwxwckgcHzHtQ98XBo0\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 320,
    "path": "../public/_nuxt/DZhHkuk_.js"
  },
  "/_nuxt/entry.CEx-l8nA.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1a908-oJBOK0QJqhfNIdpSyyNd/X1YyEg\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 108808,
    "path": "../public/_nuxt/entry.CEx-l8nA.css"
  },
  "/_nuxt/error-404.C-Ezrlz-.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"97e-YLcQ2HBNLea0KJoUeqSqSCendIU\"",
    "mtime": "2026-11-13T03:45:52.572Z",
    "size": 2430,
    "path": "../public/_nuxt/error-404.C-Ezrlz-.css"
  },
  "/_nuxt/error-500.DBWf9FGj.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"773-9MNIE+ztUss3x7HN62QKMFz0rhs\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 1907,
    "path": "../public/_nuxt/error-500.DBWf9FGj.css"
  },
  "/_nuxt/F0Ozj0iB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fb-ox/yLvJUb2Vy0xn1Fb14QxPa4UA\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 251,
    "path": "../public/_nuxt/F0Ozj0iB.js"
  },
  "/_nuxt/faATmyJe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15f-6XIvzBXRND3A0iMdm/iCSoV6pSM\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 351,
    "path": "../public/_nuxt/faATmyJe.js"
  },
  "/_nuxt/FMJ9-ldS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a7a-RtuXXqhqnv5IKlrAqwfwiEi19Uk\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2682,
    "path": "../public/_nuxt/FMJ9-ldS.js"
  },
  "/_nuxt/giKh-pfl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bc-1Gi/mhr75n8MFvDltMxzofr/Y/U\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 188,
    "path": "../public/_nuxt/giKh-pfl.js"
  },
  "/_nuxt/hqQXoOL8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"140-rqkHXVztoyNuO6Nj/Ez1kCdyvcg\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 320,
    "path": "../public/_nuxt/hqQXoOL8.js"
  },
  "/_nuxt/H_nZS_P3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16f-64iYYgiUrXUHFhJfrGJY0ugnoec\"",
    "mtime": "2026-11-13T03:45:52.684Z",
    "size": 367,
    "path": "../public/_nuxt/H_nZS_P3.js"
  },
  "/_nuxt/IVjoOONl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"960-Jwh5uCxR+5i0XtS+XiP1DkUEwH8\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 2400,
    "path": "../public/_nuxt/IVjoOONl.js"
  },
  "/_nuxt/kHqbDvkB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"138-j/7XWy69dSgB5RAPFwi2SsGBCt4\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 312,
    "path": "../public/_nuxt/kHqbDvkB.js"
  },
  "/_nuxt/l4ZGkOCs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"293-/M8OhDT4quX8lYAfY16rCmFrzgw\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 659,
    "path": "../public/_nuxt/l4ZGkOCs.js"
  },
  "/_nuxt/LPlWS8TR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e0-5flTAuFG7rGNDVp2QxjjWda55qs\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 224,
    "path": "../public/_nuxt/LPlWS8TR.js"
  },
  "/_nuxt/NsPq4TjY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a6-ZPZFMAOuHBMdK4uGcak/79ofDwI\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 166,
    "path": "../public/_nuxt/NsPq4TjY.js"
  },
  "/_nuxt/nUyIYwG_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34b-WaTIKynsPM3iRMuLKHmVrFj0Xkc\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 843,
    "path": "../public/_nuxt/nUyIYwG_.js"
  },
  "/_nuxt/LZgF3nMb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c7-cjHX0Jpgu18b35UORDfRPbkj+ck\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 199,
    "path": "../public/_nuxt/LZgF3nMb.js"
  },
  "/_nuxt/nwhm_YAY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"62dd-OCVMxmZGe05gRdpZ1ZBY298kNog\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 25309,
    "path": "../public/_nuxt/nwhm_YAY.js"
  },
  "/_nuxt/qWfI-Kk0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"139-PM/8dp7WZ07YTiWEOAhDNfeJlgc\"",
    "mtime": "2026-11-13T03:45:52.681Z",
    "size": 313,
    "path": "../public/_nuxt/qWfI-Kk0.js"
  },
  "/_nuxt/roles.BajtbzN1.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2fe-UEmot6gKqByF3CEdL7TmmIRc63Q\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 766,
    "path": "../public/_nuxt/roles.BajtbzN1.css"
  },
  "/_nuxt/sEHlYcaR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23b2-Dq6pyyTVJsMYFcx7B7PVpN5XGmY\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 9138,
    "path": "../public/_nuxt/sEHlYcaR.js"
  },
  "/_nuxt/StatsCard.BDhfddk4.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1a3-cjVavUxBmoqo+plgHfl5DM1xyCE\"",
    "mtime": "2026-11-13T03:45:52.676Z",
    "size": 419,
    "path": "../public/_nuxt/StatsCard.BDhfddk4.css"
  },
  "/_nuxt/SzO-nsBT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3667-KQEaVpG9HWOrZuP/ujl46FqIJP4\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 13927,
    "path": "../public/_nuxt/SzO-nsBT.js"
  },
  "/_nuxt/UhtBw0x4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a1-lFEJfmSblAVynx86CJIDNuigzAA\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 161,
    "path": "../public/_nuxt/UhtBw0x4.js"
  },
  "/_nuxt/TPmBPzOq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a57-4MLXF4mEJlcu1yUZrrSaTNSLLvo\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 2647,
    "path": "../public/_nuxt/TPmBPzOq.js"
  },
  "/_nuxt/uI_JZ5D7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32b9-06bzeOn0oBGu4MYGAhqCApp//wE\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 12985,
    "path": "../public/_nuxt/uI_JZ5D7.js"
  },
  "/_nuxt/user.DaVdWcwL.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"25a-/P2WVqGzVgyh2nx1PSnA2B+37c8\"",
    "mtime": "2026-11-13T03:45:52.677Z",
    "size": 602,
    "path": "../public/_nuxt/user.DaVdWcwL.css"
  },
  "/_nuxt/XsJm3Mtc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"366-unCw40prpBU/SaSiHdrKhoNAkgU\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 870,
    "path": "../public/_nuxt/XsJm3Mtc.js"
  },
  "/_nuxt/Y2or5HNZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"527f-3sm2FQRZVLvsIaHlea/EmEgbcjA\"",
    "mtime": "2026-11-13T03:45:52.687Z",
    "size": 21119,
    "path": "../public/_nuxt/Y2or5HNZ.js"
  },
  "/_nuxt/ZFapaEG2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40bf-iB+mtrVP/VHM2o9IAwVkYkibUxQ\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 16575,
    "path": "../public/_nuxt/ZFapaEG2.js"
  },
  "/_nuxt/_Pp_JlOq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17c5-J5AF8Pzal5B4qbbXyIY+0rh4caI\"",
    "mtime": "2026-11-13T03:45:52.685Z",
    "size": 6085,
    "path": "../public/_nuxt/_Pp_JlOq.js"
  },
  "/_nuxt/_TJALQI4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f27-k7NwuWAY2pQgUkT5KlK6elhv/6o\"",
    "mtime": "2026-11-13T03:45:52.679Z",
    "size": 3879,
    "path": "../public/_nuxt/_TJALQI4.js"
  },
  "/_nuxt/_xCXHFq1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10c-ZN1eeYaqJ+QGlc12ne66jRivP3k\"",
    "mtime": "2026-11-13T03:45:52.682Z",
    "size": 268,
    "path": "../public/_nuxt/_xCXHFq1.js"
  },
  "/images/team/chef-michael.jpg": {
    "type": "image/jpeg",
    "etag": "\"2a895-pSdAHD1nNRkCmFV6Z1dCqc31ZvU\"",
    "mtime": "2026-07-14T02:44:59.188Z",
    "size": 174229,
    "path": "../public/images/team/chef-michael.jpg"
  },
  "/images/team/manager-sarah.jpg": {
    "type": "image/jpeg",
    "etag": "\"2b157-raj5WOVynxMrBnRrmrjqCAqZ4Qg\"",
    "mtime": "2026-07-14T02:44:59.188Z",
    "size": 176471,
    "path": "../public/images/team/manager-sarah.jpg"
  },
  "/images/team/marketing-david.jpg": {
    "type": "image/jpeg",
    "etag": "\"3121e-2dSwH2ANF2/5qZzz4BSu3z36qNg\"",
    "mtime": "2026-07-14T02:44:59.209Z",
    "size": 201246,
    "path": "../public/images/team/marketing-david.jpg"
  },
  "/images/team/support-emma.jpg": {
    "type": "image/jpeg",
    "etag": "\"30529-i9WvlDHrV/kxwHBqnPfJpof73gg\"",
    "mtime": "2026-07-14T02:44:59.217Z",
    "size": 197929,
    "path": "../public/images/team/support-emma.jpg"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-b1Md+oNUI9sCreDUeK4/3QpZ5iA\"",
    "mtime": "2026-11-13T03:45:54.017Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/_nuxt/builds/meta/56d6f7c3-c5e6-4d3d-a30f-19f912cb44b7.json": {
    "type": "application/json",
    "etag": "\"58-l46SuUI7ipa5t2viLAZI1rFHcmk\"",
    "mtime": "2026-11-13T03:45:54.022Z",
    "size": 88,
    "path": "../public/_nuxt/builds/meta/56d6f7c3-c5e6-4d3d-a30f-19f912cb44b7.json"
  },
  "/images/developer/rithy.png": {
    "type": "image/png",
    "etag": "\"7464c-uB3Pi3lCUwWmYyYyiq0Ty+DVQVs\"",
    "mtime": "2026-07-14T02:44:59.128Z",
    "size": 476748,
    "path": "../public/images/developer/rithy.png"
  },
  "/images/developer/laravel.png": {
    "type": "image/png",
    "etag": "\"98686-KoGCePI1/MFdhu7hxex442WFLdI\"",
    "mtime": "2026-07-14T02:44:59.111Z",
    "size": 624262,
    "path": "../public/images/developer/laravel.png"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _t9B4ok = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _SxA8c9 = defineEventHandler(() => {});

const _lazy_A1SRJK = () => import('../routes/renderer.mjs');

const handlers = [
  { route: '', handler: _t9B4ok, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_A1SRJK, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_A1SRJK, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp = createNitroApp();
function useNitroApp() {
  return nitroApp;
}
runNitroPlugins(nitroApp);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

export { trapUnhandledNodeErrors as a, useNitroApp as b, getResponseStatus as c, destr as d, defineRenderHandler as e, getQuery as f, getResponseStatusText as g, createError$1 as h, getRouteRules as i, joinRelativeURL as j, joinURL as k, setupGracefulShutdown as s, toNodeListener as t, useRuntimeConfig as u };
//# sourceMappingURL=nitro.mjs.map
