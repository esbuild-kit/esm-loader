# esm-loader

Node.js `import` hook to transform TypeScript to ESM on demand using [esbuild](https://esbuild.github.io/).

### Features
- Converts TypeScript to ESM
- Supports new extensions `.cjs` + `.mjs` (and `.cts` &`.mts`)
- Supports Node.js 12.20.0 and up
- Handles `node:` import prefixes
- Sourcemap support
- Cached for performance boost

> **Tip:**
>
> _esm-loader_ doesn't hook into `require()` calls.
>
> Use this with [cjs-loader](https://github.com/esbuild-kit/cjs-loader) for `require()` support. Alternatively, use [esb](https://github.com/esbuild-kit/esb) to handle them both automatically.

## Install

```sh
npm install --save-dev @esbuild-kit/esm-loader
```

## Usage

Pass `@esbuild/esm-loader` into the [`--loader`](https://nodejs.org/api/cli.html#--experimental-loadermodule) flag.
```sh
node --loader @esbuild/esm-loader ./file.js
```

### TypeScript configuration
The following properties are used from `tsconfig.json` in the working directory:
- `jsxFactory`
- `jsxFragmentFactory`

### Cache
Modules transformations are cached in the system cache directory ([`TMPDIR`](https://en.wikipedia.org/wiki/TMPDIR)). Transforms are cached by content hash so duplicate dependencies are not re-transformed.

Set environment variable `ESBK_DISABLE_CACHE` to a truthy value to disable the cache:

```sh
ESBK_DISABLE_CACHE=1 node --loader @esbuild/esm-loader ./file.js
```

## FAQ

### Can it import JSON modules?
Yes. This loader enables importing native [JSON modules](https://nodejs.org/api/esm.html#json-modules).

### Can it import ESM modules over network?

Node.js has built-in support for network imports [behind the `--experimental-network-imports` flag](https://nodejs.org/api/esm.html#network-based-loading-is-not-enabled-by-default).

You can pass it in with `esm-loader`:

```sh
node --loader @esbuild/esm-loader --experimental-network-imports ./file.js
```

### Can it resolve files without an extension?

In ESM, import paths must be explicit (must include file name and extension).

For backwards compatibility, this loader adds support for classic Node resolution for extensions: `.js`, `.json`, `.ts`, `.tsx`, `.jsx`. Resolving a `index` file by the directory name works too.

```js
import file from './file' // -> ./file.js
import directory from './directory' // -> ./directory/index.js
```

## Related

- [@esbuild-kit/esb](https://github.com/esbuild-kit/esb) - Node.js runtime powered by esbuild using `@esbuild-kit/cjs-loader` and `@esbuild-kit/esb-loader`.

- [@esbuild-kit/cjs-loader](https://github.com/esbuild-kit/cjs-loader) - TypeScript & ESM to CJS transpiler using the Node.js loader API.
