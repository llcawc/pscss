import { UserDefinedOptions } from '@fullhuman/postcss-purgecss';
import { Transform } from 'node:stream';
import rename from './rename.js';
export { rename };
/**
 * Gulp plugin for simple processing of sass styles and modern css style.
 * @param options - optons {}
 * @param options.minify minify CSS files
 * @param option.loadPaths paths for files to imports for SASS/SCSS compiler
 * @param option.purgeCSSoptions remove unused CSS from file - options PurgeCSS
 * @returns object stream.
 *
 * @example
 *
 * ```js
 * // import modules
 * import { dest, src } from "gulp";
 * import { pscss, rename } from "pscss";
 *
 * // css task
 * function css() {
 *   return src(['src/styles/main.css'], { sourcemaps: true })
 *     .pipe(
 *       pscss({
 *         minify: false,
 *         purgeCSSoptions: {
 *           content: ['src/*.html', 'src/scripts/main.js'],
 *         },
 *       })
 *     )
 *   .pipe(rename({ suffix: '.min', extname: '.css' }))
 *   .pipe(dest('dist/css', { sourcemaps: true })) // for inline map
 * }
 *
 * // export
 * export { css }
 *
 * ```
 */
export declare function pscss(options?: {
    minify?: boolean | undefined;
    purgeCSSoptions?: UserDefinedOptions | undefined;
    loadPaths?: string[] | undefined;
}): Transform;
