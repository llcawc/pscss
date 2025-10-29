# @pasmurno/serve

simple static server for local development based [Vite](https://vite.dev/)

## Getting started

Install the @pasmurno/serve as global package:

```sh
npm install -g @pasmurno/serve
```

or install local in project:

```sh
npm install --save-dev @pasmurno/serve
```

## Commands

Usage for global install:

```sh
$ serve [options]
```

Usage for install in project:

```sh
$ npx serve [options]
```

Use in package.json scripts:

```json
"scripts": {
  "serve": "serve [options]"
}
```

and start this:

```sh
$ npm run serve
```

## Options:

```
-v, --version       output the current version
-p, --port <n>      server port number (default: 3000)
-d, --dist [value]  folder for serve files (default: dist)
-s, --host          listen on all addresses, including LAN and public addresses
-h, --help          display help for command
```

## Example call:

```sh
$ serve -p 4200 -d build --host
...
$ npx serve --port 8000 --dist './static'
```

API / Gulp
You can programmatically start the local server if you import the server() function from the @pasmurno/serve package:

```js
import server from "@pasmurno/serve";

async function browse() {
  await server({
    port: 8080, // server port number (default: 3000)
    dist: "dist", // folder for serve files (default: dist)
    host: true, // Set true to listen on all addresses, including LAN and public addresses (default: undefined)
  });
}
```

The best way to apply this can be found in the gulp project assignment.

---

## License

MIT ©2025 pasmurno by [llcawc](https://github.com/llcawc). Made with ❤ to beautiful architecture
