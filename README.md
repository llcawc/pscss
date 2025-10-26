# @pasmurno/pscss

A powerful Gulp plugin for processing Sass/SCSS styles and modern CSS with built-in optimization and purging capabilities.

## ✨ Features

- **Multi-format support**: `.css`, `.scss`, `.sass`, `.pcss` files
- **Sass compilation**: Uses Embedded Sass Host (Dart Sass) for fast compilation
- **PostCSS processing**: Modern CSS features with autoprefixer and nested rules
- **CSS optimization**: Built-in minification with cssnano
- **Unused CSS removal**: PurgeCSS integration for smaller bundles
- **Source maps**: Full source map support for debugging
- **Bootstrap compatibility**: Optimized for Bootstrap 5.3+ (Sass 1.78.0)
- **Security**: Built-in protection against DoS attacks (10MB file size limit)

## 📦 Installation

```bash
npm install --save-dev @pasmurno/pscss
```

## ⚙️ Configuration Options

```typescript
interface PscssOptions {
  minify?: boolean; // Minify CSS files (default: true)
  presetEnv?: boolean; // Use future CSS features today (default: false)
  purgeCSSoptions?: UserDefinedOptions; // Remove unused CSS from file
  loadPaths?: string[]; // Paths for SASS/SCSS imports
}
```

## 🚀 Usage Examples

### Basic CSS Processing

```javascript
import { dest, src } from "gulp";
import { pscss, rename } from "@pasmurno/pscss";

function css() {
  return src(["src/styles/main.css"], { sourcemaps: true })
    .pipe(pscss())
    .pipe(rename({ suffix: ".min", extname: ".css" }))
    .pipe(dest("dist/css", { sourcemaps: true }));
}

export { css };
```

### SCSS with PurgeCSS

```javascript
function scss() {
  return src(["src/scss/main.scss"], { sourcemaps: true })
    .pipe(
      pscss({
        minify: true,
        purgeCSSoptions: {
          content: ["src/**/*.html", "src/**/*.js", "src/**/*.tsx", "src/**/*.vue"],
          fontFace: true, // Remove unused @font-face
          keyframes: true, // Remove unused @keyframes
          variables: true, // Remove unused CSS variables
          safelist: [/^show/, /^fade/, /^modal/], // Keep these selectors
        },
      }),
    )
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("dist/css", { sourcemaps: "." }));
}

export { scss };
```

### PostCSS Preset Env

```javascript
function modernCSS() {
  return src(["src/css/modern.css"], { sourcemaps: true })
    .pipe(
      pscss({
        presetEnv: true, // Use postcss-preset-env instead of autoprefixer
        minify: false,
      }),
    )
    .pipe(dest("dist/css", { sourcemaps: true }));
}

export { modernCSS };
```

### Custom Load Paths for Sass

```javascript
function sassWithPaths() {
  return src(["src/sass/main.sass"], { sourcemaps: true })
    .pipe(
      pscss({
        loadPaths: ["src/sass", "node_modules/bootstrap/scss", "node_modules/@fortawesome/fontawesome-free/scss"],
      }),
    )
    .pipe(dest("dist/css", { sourcemaps: true }));
}

export { sassWithPaths };
```

### Complete Gulpfile Example

```javascript
import { dest, src, series, parallel } from "gulp";
import { pscss, rename } from "@pasmurno/pscss";
import { deleteAsync } from "del";

// Clean task
async function clean() {
  await deleteAsync(["dist"]);
}

// CSS task
function css() {
  return src(["src/css/*.css"], { sourcemaps: true })
    .pipe(pscss())
    .pipe(dest("dist/css", { sourcemaps: true }));
}

// SCSS task with optimization
function scss() {
  return src(["src/scss/*.scss"], { sourcemaps: true })
    .pipe(
      pscss({
        purgeCSSoptions: {
          content: ["src/**/*.{html,js,tsx,vue}"],
          safelist: [/^show/, /^fade/],
        },
      }),
    )
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("dist/css", { sourcemaps: "." }));
}

// Export tasks
export const build = series(clean, parallel(css, scss));
export const watch = () => {
  // Add your watch tasks here
};
```

## 🔧 How It Works

### Sass/SCSS Processing

- Uses [Embedded Sass Host](https://www.npmjs.com/package/sass-embedded) (Dart Sass)
- Supports both `.scss` and `.sass` syntax
- Automatic source map generation
- Custom load paths for imports

### PostCSS Processing

**Default plugins** (when `presetEnv: false`):

- `postcss-import` - Import CSS fragments
- `postcss-nested` - Unwrap nested rules like Sass
- `autoprefixer` - Add vendor prefixes

**Preset Env plugins** (when `presetEnv: true`):

- `postcss-import` - Import CSS fragments
- `postcss-preset-env` - Use future CSS features today

**Optional plugins**:

- `cssnano` - CSS minification (when `minify: true`)
- `purgeCSSPlugin` - Remove unused CSS (when `purgeCSSoptions` provided)

### CSS Optimization

- **Minification**: Uses cssnano with optimized settings
- **PurgeCSS**: Remove unused CSS based on content analysis
- **Source Maps**: Full debugging support
- **Security**: 10MB file size limit to prevent DoS attacks

## 📁 File Renaming

The plugin includes a `rename` utility for flexible file naming:

```javascript
import { rename } from "@pasmurno/pscss";

// Change basename
.pipe(rename({ basename: "main" }))

// Add suffix
.pipe(rename({ suffix: ".min" }))

// Change extension
.pipe(rename({ extname: ".css" }))

// Combine options
.pipe(rename({ basename: "main", suffix: ".min", extname: ".css" }))
```

## 🛡️ Security Features

- **File size validation**: Prevents processing files larger than 10MB
- **Stream rejection**: Only processes buffer files, not streams
- **Partial file skipping**: Automatically skips Sass partials (files starting with `_`)

## 📊 Performance

- **Fast compilation**: Uses Dart Sass for optimal performance
- **Memory efficient**: Processes files in streams
- **Parallel processing**: Supports Gulp's parallel task execution
- **Smart caching**: Leverages PostCSS and Sass caching mechanisms

## 📄 License

MIT License ©2025 by [llcawc](https://github.com/llcawc) (pasmurno). Made with <span style="color:red;">❤</span> for beautiful architecture.
