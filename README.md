# esm-loader

Node.js `import` hook to instantaneously transform TypeScript to ESM on demand using [esbuild](https://esbuild.github.io/).

### Features
- Transforms TypeScript to ESM on demand
- Classic Node.js resolution (extensionless & directory imports)
- Cached for performance boost
- Supports Node.js v12.20.0+
- Handles `node:` import prefixes

> **Tip:**
>
> _esm-loader_ doesn't hook into `require()` calls or transform CommonJS files (`.js` in commonjs package, `.cjs`, `.cts`).
>
> Use this with [cjs-loader](https://github.com/esbuild-kit/cjs-loader) for CommonJS support. Alternatively, use [tsx](https://github.com/esbuild-kit/tsx) to handle them both automatically.

## Install

```sh
npm install --save-dev @esbuild-kit/esm-loader
```

## Usage

Pass `@esbuild-kit/esm-loader` into the [`--loader`](https://nodejs.org/api/cli.html#--experimental-loadermodule) flag.
```sh
node --loader @esbuild-kit/esm-loader ./file.ts
```

### TypeScript configuration
The following properties are used from `tsconfig.json` in the working directory:
- `jsxFactory`
- `jsxFragmentFactory`

### Cache
Modules transformations are cached in the system cache directory ([`TMPDIR`](https://en.wikipedia.org/wiki/TMPDIR)). Transforms are cached by content hash so duplicate dependencies are not re-transformed.

Set environment variable `ESBK_DISABLE_CACHE` to a truthy value to disable the cache:

```sh
ESBK_DISABLE_CACHE=1 node --loader @esbuild-kit/esm-loader ./file.ts
```

## FAQ

### Can it import JSON modules?
Yes. This loader transpiles JSON modules so it's also compatible with named imports.

### Can it import ESM modules over network?

Node.js has built-in support for network imports [behind the `--experimental-network-imports` flag](https://nodejs.org/api/esm.html#network-based-loading-is-not-enabled-by-default).

You can pass it in with `esm-loader`:

```sh
node --loader @esbuild-kit/esm-loader --experimental-network-imports ./file.ts
```

### Can it resolve files without an extension?

In ESM, import paths must be explicit (must include file name and extension).

For backwards compatibility, this loader adds support for classic Node resolution for extensions: `.js`, `.json`, `.ts`, `.tsx`, `.jsx`. Resolving a `index` file by the directory name works too.

```js
import file from './file' // -> ./file.js
import directory from './directory' // -> ./directory/index.js
```

## Related

- [tsx](https://github.com/esbuild-kit/tsx) - Node.js runtime powered by esbuild using [`@esbuild-kit/cjs-loader`](https://github.com/esbuild-kit/cjs-loader) and [`@esbuild-kit/esm-loader`](https://github.com/esbuild-kit/esm-loader).

- [@esbuild-kit/cjs-loader](https://github.com/esbuild-kit/cjs-loader) - TypeScript & ESM to CJS transpiler using the Node.js loader API.
