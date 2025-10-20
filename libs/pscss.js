import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { Buffer } from 'node:buffer';
import { join, relative } from 'node:path';
import { Transform } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import PluginError from 'plugin-error';
import postcss from 'postcss';
import atImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import { compileStringAsync } from 'sass-embedded';
import rename from './rename.js';
export { rename };
/**
 * Gulp plugin for simple processing of sass styles and modern css style.
 * @param options - optons {}
 * @param options.minify minify CSS files
 * @param options.presetEnv allows you to use future CSS features today
 * @param option.loadPaths paths for files to imports for SASS/SCSS compiler
 * @param option.purgeCSSoptions remove unused CSS from file - options PurgeCSS
 * @returns object stream.
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
export function pscss(options = {}) {
    const stream = new Transform({ objectMode: true });
    stream._transform = async (file, _, callback) => {
        // Skip null files
        if (file.isNull()) {
            return callback(null, file);
        }
        // Reject streams
        if (file.isStream()) {
            callback(new PluginError('pscss', 'Streams are not supported'));
            return;
        }
        // Skip partials
        if (file.stem.startsWith('_')) {
            callback();
            return;
        }
        if (file.isBuffer()) {
            const minify = options.minify ?? true;
            const presetEnv = options.presetEnv ?? false;
            const loadPaths = options.loadPaths ?? [file.base, join(file.cwd, 'node_modules')];
            const sourceMap = file.sourceMap ? true : false;
            const extname = file.extname.split('.').pop()?.toLowerCase() ?? '';
            let prevSourceMap = false;
            try {
                // run sass compiler for sass or scss files
                if (/^(scss|sass)$/i.test(extname)) {
                    await sass(file, loadPaths, sourceMap);
                    prevSourceMap = sourceMap ? true : false;
                }
                // run postcss
                await post(file, minify, presetEnv, options.purgeCSSoptions, sourceMap, prevSourceMap);
                callback(null, file);
            }
            catch (err) {
                const error = new PluginError('pscss', err, { fileName: file.path });
                callback(error);
                throw error;
            }
        }
    };
    return stream;
}
// postcss compiler
async function post(file, minify, presetEnv, purgeCSSoptions, sourceMap, prevSourceMap) {
    if (file.isBuffer()) {
        try {
            const isPresetEnv = presetEnv ? true : false;
            const isPurge = purgeCSSoptions ? true : false;
            const prevMap = prevSourceMap ? file.sourceMap : false;
            const mapOptions = { inline: false, annotation: false, prev: prevMap };
            const css = new TextDecoder().decode(file.contents);
            let postcssPlugins = [];
            // use PresetEnv or not
            if (isPresetEnv) {
                postcssPlugins = [atImport(), postcssPresetEnv()];
            }
            else {
                postcssPlugins = [atImport(), postcssNested(), autoprefixer()];
            }
            // include PurgeCSS
            if (isPurge) {
                postcssPlugins.push(purgeCSSPlugin(purgeCSSoptions));
            }
            // include cssnano
            if (minify) {
                postcssPlugins.push(cssnano({
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true }, // Remove all comments
                            mergeLonghand: false, // Preserve longhand for better readability
                        },
                    ],
                }));
            }
            // run compiler
            const result = await postcss(postcssPlugins).process(css, {
                from: file.path,
                to: file.path,
                map: sourceMap ? mapOptions : undefined,
            });
            file.contents = Buffer.from(result.css);
            file.extname = '.css';
            if (result.map && sourceMap) {
                file.sourceMap = result.map.toJSON();
            }
        }
        catch (err) {
            const error = err;
            throw new Error(`Error! Postcss compiler: ${error.message}`);
        }
    }
}
// sass compiler
async function sass(file, loadPaths, sourceMap) {
    if (file.isBuffer()) {
        try {
            const content = new TextDecoder().decode(file.contents);
            const result = await compileStringAsync(content, {
                url: pathToFileURL(file.path),
                loadPaths: loadPaths,
                syntax: file.extname === '.sass' ? 'indented' : 'scss',
                style: 'expanded',
                sourceMap: sourceMap,
                sourceMapIncludeSources: true,
            });
            file.contents = Buffer.from(result.css);
            file.extname = '.css';
            if (result.sourceMap && sourceMap) {
                cleanSourceMap(file, JSON.parse(JSON.stringify(result.sourceMap)));
            }
        }
        catch (err) {
            const error = err;
            throw new Error(`Error! Sass compiler: ${error.message}`);
        }
    }
}
// Update source map
function cleanSourceMap(file, map) {
    const basePath = file.base;
    map.file = file.relative.replace(/\\/g, '/');
    map.sources = map.sources.map((path) => {
        if (path.startsWith('file:')) {
            path = fileURLToPath(path);
        }
        path = relative(basePath, path);
        return path.replace(/\\/g, '/');
    });
    file.sourceMap = map;
}
