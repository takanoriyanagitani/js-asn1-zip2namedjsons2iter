import { bind } from "./io.mjs";

/** @import { IO } from "./io.mjs" */

/** @type function(string): IO<Response> */
export function url2response(url) {
  return () => fetch(url);
}

/** @type function(Response): IO<ArrayBuffer> */
export function response2buffer(res) {
  return () => res.arrayBuffer();
}

/** @type function(string): IO<ArrayBuffer> */
export function url2buffer(url) {
  /** @type IO<Response> */
  const ires = url2response(url);

  return bind(ires, response2buffer);
}
