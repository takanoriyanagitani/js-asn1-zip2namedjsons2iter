import { bind, lift } from "./io.mjs";

import { blob2zcat2text } from "./zcat.mjs";

/** @import { IO } from "./io.mjs" */

/** @type function(string): string[] */
export function text2splited2names(text) {
  const splited = text.split(/\n/);
  return splited.filter((t) => 0 < t.length);
}

/** @type function(string): object[] */
export function text2splited2jsonl2parsed(text) {
  /** @type string[] */
  const lines = text2splited2names(text);
  return lines.map((t) => JSON.parse(t));
}

/** @type function(Blob): IO<string[]> */
export function blob2names(blb) {
  return bind(
    blob2zcat2text(blb),
    lift((txt) => Promise.resolve(text2splited2names(txt))),
  );
}

/** @type function(Blob): IO<object[]> */
export function blob2objects(blb) {
  return bind(
    blob2zcat2text(blb),
    lift((txt) => Promise.resolve(text2splited2jsonl2parsed(txt))),
  );
}
