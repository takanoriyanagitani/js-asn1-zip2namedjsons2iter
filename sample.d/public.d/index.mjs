import { url2namedJsons } from "./index-min.mjs";

(async () => {
  /** @type string */
  const url = "buckets.zip";

  /** @type IO<AsyncGenerator<NamedJson, void, unknown>> */
  const inamedJsons = url2namedJsons(url);

  /** @type Promise<AsyncGenerator<NamedJson, void, unknown>> */
  const pnamedJsons = inamedJsons();

  /** @type AsyncGenerator<NamedJson, void, unknown> */
  const namedJsons = await pnamedJsons;

  const div = document.getElementById("app-root");
  div.textContent = "";

  const frag = new DocumentFragment();

  for await (const namedJson of namedJsons) {
    const cdiv = document.createElement("div");
    cdiv.textContent = JSON.stringify(namedJson);
    frag.appendChild(cdiv);
  }

  div.appendChild(frag);
})();
