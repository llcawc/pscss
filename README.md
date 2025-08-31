# pscss

Gulp plugin for simple processing of sass styles and modern css style.

Files with the extensions `.css, .scss, .sass, .pcss` are supported. It is also possible to process files of the Bootsrtap 5.3.. versions framework (sass version 1.78.0 was used here to eliminate the warning).

## install:

```
npm install --save-dev pscss
```

## options:

```
options?: {
    minify?: boolean | undefined // minify CSS files (default: true)
    purgeCSSoptions?: UserDefinedOptions | undefined // remove unused CSS from file
    loadPaths?: string[] | undefined // paths for files to imports for SASS/SCSS compiler
}
```

### sample:

```js
// import modules
import { dest, series, src } from "gulp";
import { pscss, rename } from "pscss";

// css task
function makeCSS() {
  return src(["src/css/style.css"], { sourcemaps: true })
    .pipe(pscss())
    .pipe(rename({ basename: "main.css" }))
    .pipe(dest("dist/css", { sourcemaps: true })); // for internal map
}

// pcss task
function makePCSS() {
  return src(["src/pcss/style.pcss"], { sourcemaps: true })
    .pipe(
      pscss({
        purgeCSSoptions: {
          content: ["src/assets/include/css/*.html", "src/assets/scripts/main.js"],
        },
      }),
    )
    .pipe(rename({ basename: "main.css" }))
    .pipe(dest("dist/css", { sourcemaps: "." })); // for external map
}

// scss task
function makeSCSS() {
  return src(["src/scss/style.scss"], { sourcemaps: true })
    .pipe(
      pscss({
        purgeCSSoptions: {
          content: [
            "src/assets/include/sass/*.html",
            "src/assets/scripts/script.js",
            "node_modules/bootstrap/js/dist/dom/*.js",
            "node_modules/bootstrap/js/dist/dropdown.js",
          ],
          fontFace: true, // remove unused font-face
          keyframes: true, // remove unused keyframes
          variables: true, // remove unused variables
          safelist: [/^show/],
        },
      }),
    )
    .pipe(rename({ basename: "main.css" }))
    .pipe(dest("dist/css", { sourcemaps: "." }));
}

// sass task
function makeSASS() {
  return src(["src/sass/style.sass"])
    .pipe(pscss())
    .pipe(rename({ basename: "main.css" }))
    .pipe(dest("dist/css"));
}

// clean dist task
async function cleanDist(cb) {
  await deleteAsync(["dist"]);
  cb();
}

export const css = series(cleanDist, makeCSS);
export const pcss = series(cleanDist, makePCSS);
export const scss = series(cleanDist, makeSCSS);
export const sass = series(cleanDist, makeSASS);
```

### How it works

The plugin uses the [Embedded Sass Host](https://www.npmjs.com/package/sass-embedded) (Dart SASS as `sass-embedded`) compiler for sass/scss files.

[PostCSS](https://github.com/postcss/postcss) is used with the `postcss-import` and `postcss-preset-env` plugins to support importing CSS fragments for css/pcss files, new style standards, and target browsers.

PostCSS is also used for all files for CSS minification (plugin `cssnano`), including target browser compatibility (via the browser list).

### Remove Unused CSS

To support the removal of unused styles, the [PurgeCSS](https://purgecss.com/) plugin is used (config option `purgeCSSoptions`). You can create a configuration for PurgeCSS use [this](https://purgecss.com/configuration.html) docunentation.

### Source Map

The plugin generates/updates source code maps for debugging (uses gulp functions `src` and `dest` options).

### Rename files

If you need to rename a file, you can import the gulp "rename" function from `pscss`

---

MIT License ©2025 by pasmurno from [llcawc](https://github.com/llcawc). Made with <span style="color:red;">❤</span> to beautiful architecture.
