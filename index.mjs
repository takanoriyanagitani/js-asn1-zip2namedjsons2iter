import * as asn1 from "asn1js";

import * as fflate from "fflate";

import { bind, kvpairs2map, lift } from "./io.mjs";

import { blob2zcat2text } from "./zcat.mjs";

import { url2response } from "./req.mjs";

import {
  blob2names,
  blob2objects,
  text2splited2jsonl2parsed,
  text2splited2names,
} from "./namedjson.mjs";

/** @import { IO } from "./io.mjs" */

/**
 * @param {ArrayBuffer} buf DER encoded bytes of a Sequence.
 * @returns {asn1.Sequence?}
 */
export function buf2sequence(buf) {
  /** @type asn1.FromBerResult */
  const parsed = asn1.fromBER(buf);

  if (-1 === parsed.offset) return null;

  /** @type boolean */
  const isSequence = parsed.result instanceof asn1.Sequence;

  // @ts-ignore
  return isSequence ? parsed.result : null;
}

/**
 * @param {asn1.Sequence} seq The sequence of named jsons(names & jsonl).
 * @returns {[Blob, Blob]} The gzipped names and gzipped jsonl.
 */
export function seq2kvpair(seq) {
  const values = seq.valueBlock.value;

  /** @type number */
  const sz = values.length;

  if (2 !== sz) return [new Blob(), new Blob()];

  const akey = values[0];
  const aval = values[1];

  const kchk = akey instanceof asn1.OctetString;
  const vchk = aval instanceof asn1.OctetString;

  const ok = kchk && vchk;
  if (!ok) return [new Blob(), new Blob()];

  /** @type ArrayBuffer */
  const kbuf = akey.getValue();

  /** @type ArrayBuffer */
  const vbuf = aval.getValue();

  return [new Blob([kbuf]), new Blob([vbuf])];
}

/**
 * @param {Response} zp The zip response.
 * @returns {IO<Map<string, Uint8Array>>} The buckets(name => bucket content).
 */
export function zip2buckets(zp) {
  return () => {
    /** @type Promise<Uint8Array> */
    const pbytes = zp.bytes();

    /** @type Promise<fflate.Unzipped> */
    const punzipped = pbytes.then((bytes) => fflate.unzipSync(bytes));

    const pmap = punzipped.then((unzipped) => {
      const keys = Object.keys(unzipped);
      /** @type Array<[string, Uint8Array]> */
      const pairs = keys.map((key) => {
        /** @type Uint8Array */
        const val = unzipped[key];

        return [key, val];
      });
      return new Map(pairs);
    });

    return pmap;
  };
}

/** @type function(Uint8Array): asn1.Sequence? */
export function bytes2sequence(b) {
  /** @type ArrayBuffer */
  const buf = bytes2buf(b);
  return buf2sequence(buf);
}

/** @type function(Uint8Array): ArrayBuffer */
export function bytes2buf(b) {
  const buf = b.buffer;
  if (buf instanceof ArrayBuffer) return buf;
  return new ArrayBuffer();
}

/**
 * @param {Uint8Array} b
 * @returns {[Blob, Blob]} Gzipped names and gzipped jsonl.
 */
export function bytes2blobs(b) {
  /** @type asn1.Sequence? */
  const oseq = bytes2sequence(b);

  if (!oseq) return [new Blob(), new Blob()];

  /** @type asn1.Sequence */
  const seq = oseq;

  return seq2kvpair(seq);
}

/**
 * @param {Uint8Array} b
 * @returns {IO<[string[], object[]]>} Gzipped names and gzipped jsonl.
 */
export function bytes2namedjsons(b) {
  /** @type [Blob, Blob] */
  const pair = bytes2blobs(b);

  /** @type IO<string[]> */
  const inames = blob2names(pair[0]);

  /** @type IO<object[]> */
  const iobjs = blob2objects(pair[1]);

  return bind(
    inames,
    (names) =>
      bind(
        iobjs,
        lift((objs) => Promise.resolve([names, objs])),
      ),
  );
}

/**
 * @param {string} _bucketName
 * @param {Uint8Array} bucketContent
 * @returns {IO<[string[], object[]]>} Gzipped names and gzipped jsonl.
 */
export function bucket2namedJsons(_bucketName, bucketContent) {
  return bytes2namedjsons(bucketContent);
}

/**
 * @typedef {object} NamedJson
 * @property {string} name
 * @property {object} json
 */

/**
 * @param {string} bucketName
 * @param {Uint8Array} bucketContent
 * @returns {IO<Generator<NamedJson, void, unknown>>}
 */
export function bucket2namedJsonPairs(bucketName, bucketContent) {
  /** @type IO<[string[], object[]]> */
  const iarrPair = bucket2namedJsons(bucketName, bucketContent);

  return bind(
    iarrPair,
    lift((arrPair) =>
      Promise.resolve(function* () {
        const [names, objects] = arrPair;

        /** @type number */
        const nsz = names.length;

        for (let i = 0; i < nsz; i++) {
          /** @type string */
          const name = names[i];

          /** @type object? */
          const ojson = objects[i] ?? null;

          if (!ojson) return;

          /** @type object */
          const obj = ojson;

          yield Object.freeze({
            name,
            json: obj,
          });
        }
      }())
    ),
  );
}

/**
 * @param {Map<string, Uint8Array>} buckets
 * @returns {IO<AsyncGenerator<NamedJson, void, unknown>>}
 */
export function buckets2namedJsonPairs(buckets) {
  return () => {
    return Promise.resolve(async function* () {
      for (const pair of buckets) {
        const [bname, bvalue] = pair;
        /** @type IO<Generator<NamedJson, void, unknown>> */
        const igen = bucket2namedJsonPairs(bname, bvalue);

        /** @type Promise<Generator<NamedJson, void, unknown>> */
        const pgen = igen();

        /** @type Generator<NamedJson, void, unknown> */
        const gen = await pgen;

        for (const nj of gen) {
          yield nj;
        }
      }
    }());
  };
}

/**
 * @param {Response} zp The zip response.
 * @returns {IO<AsyncGenerator<NamedJson, void, unknown>>}
 */
export function zip2namedJsons(zp) {
  return bind(
    zip2buckets(zp),
    buckets2namedJsonPairs,
  );
}

/**
 * @param {string} zurl The url of the zip file.
 * @returns {IO<AsyncGenerator<NamedJson, void, unknown>>}
 */
export function url2namedJsons(zurl) {
  return bind(
    url2response(zurl),
    zip2namedJsons,
  );
}
