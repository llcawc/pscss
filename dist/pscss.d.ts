import { Transform } from "node:stream";
import { UserDefinedOptions } from "@fullhuman/postcss-purgecss";

//#region src/pscss.d.ts
interface PscssOptions {
  minify?: boolean | undefined;
  presetEnv?: boolean | undefined;
  purgeCSSoptions?: UserDefinedOptions | undefined;
  loadPaths?: string[] | undefined;
}
interface RenameOptions {
  basename?: string | undefined;
  extname?: string | undefined;
  suffix?: string | undefined;
}
/**
 * Gulp plugin for simple processing of sass styles and modern css style.
 * @param minify minify CSS files options
 * @param presetEnv allows you to use future CSS features today
 * @param loadPaths paths for files to imports for SASS/SCSS compiler
 * @param purgeCSSoptions remove unused CSS from file - options PurgeCSS
 * @returns object Transform stream.
 *
 * @example
 *
 * ```js
 * // import modules
 * import { dest, src } from "gulp";
 * import { pscss, rename } from "@pasmurno/pscss";
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
declare function pscss({
  minify,
  presetEnv,
  purgeCSSoptions,
  loadPaths
}?: PscssOptions): Transform;
/**
 * Gulp plugin for rename file - change extname or/and added suffix
 * @param basename - new file name (file stem and file extension)
 * @param extname - new file extension
 * @param suffix - new file suffix
 */
declare function rename({
  basename,
  extname,
  suffix
}?: RenameOptions): Transform;
//#endregion
export { type PscssOptions, type RenameOptions, type UserDefinedOptions, pscss, rename };