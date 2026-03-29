import { rename } from "./rename.js";
import { Buffer } from "node:buffer";
import { join, relative } from "node:path";
import { Transform } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import purgeCSSPlugin from "@fullhuman/postcss-purgecss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import PluginError from "plugin-error";
import postcss from "postcss";
import atImport from "postcss-import";
import postcssNested from "postcss-nested";
import postcssPresetEnv from "postcss-preset-env";
import { compileStringAsync } from "sass-embedded";
//#region src/pscss.ts
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
function pscss({ minify = true, presetEnv = false, purgeCSSoptions, loadPaths } = {}) {
	const stream = new Transform({ objectMode: true });
	stream._transform = async (file, _, callback) => {
		if (file.isNull()) return callback(null, file);
		if (file.isStream()) {
			callback(new PluginError("pscss", "Streams are not supported"));
			return;
		}
		if (file.stem.startsWith("_")) {
			callback();
			return;
		}
		if (file.isBuffer()) {
			if (file.contents.length > 10 * 1024 * 1024) {
				callback(new PluginError("pscss", "File too large"));
				return;
			}
			if (!loadPaths) loadPaths = [file.base, join(file.cwd, "node_modules")];
			const sourceMap = !!file.sourceMap;
			const extname = file.extname.split(".").pop()?.toLowerCase() ?? "";
			let prevSourceMap = false;
			try {
				if (/^(scss|sass)$/i.test(extname)) {
					await sass(file, loadPaths, sourceMap);
					prevSourceMap = sourceMap;
				}
				await post(file, minify, presetEnv, purgeCSSoptions, sourceMap, prevSourceMap);
				callback(null, file);
			} catch (err) {
				throw new PluginError("pscss", err, {
					fileName: file.path,
					showStack: true
				});
			}
		}
	};
	return stream;
}
async function post(file, minify, presetEnv, purgeCSSoptions, sourceMap, prevSourceMap) {
	if (file.isBuffer()) try {
		const isPresetEnv = presetEnv;
		const isPurge = !!purgeCSSoptions;
		const mapOptions = {
			inline: false,
			annotation: false,
			prev: prevSourceMap ? file.sourceMap : false
		};
		const css = new TextDecoder().decode(file.contents);
		let postcssPlugins = [];
		if (isPresetEnv) postcssPlugins = [atImport(), postcssPresetEnv()];
		else postcssPlugins = [
			atImport(),
			postcssNested(),
			autoprefixer()
		];
		if (isPurge) {
			if (!purgeCSSoptions || typeof purgeCSSoptions !== "object" || Array.isArray(purgeCSSoptions)) throw new Error("Error! Postcss compiler: Check the type PurgeCSS options.");
			if (!purgeCSSoptions.content || !Array.isArray(purgeCSSoptions.content) || purgeCSSoptions.content.length === 0) throw new Error("Error! Postcss compiler: PurgeCSS requires a non-empty \"content\" array.");
			const purgePlagin = purgeCSSPlugin(purgeCSSoptions);
			postcssPlugins.push(purgePlagin);
		}
		if (minify) postcssPlugins.push(cssnano({ preset: ["default", {
			discardComments: { removeAll: true },
			mergeLonghand: false
		}] }));
		const result = await postcss(postcssPlugins).process(css, {
			from: file.path,
			to: file.path,
			map: sourceMap ? mapOptions : void 0
		});
		file.contents = Buffer.from(result.css);
		file.extname = ".css";
		if (result.map && sourceMap) file.sourceMap = result.map.toJSON();
	} catch (err) {
		const error = err;
		throw new PluginError("pscss", error, { message: error.message });
	}
}
async function sass(file, loadPaths, sourceMap) {
	if (file.isBuffer()) try {
		const result = await compileStringAsync(new TextDecoder().decode(file.contents), {
			url: pathToFileURL(file.path),
			loadPaths,
			syntax: file.extname === ".sass" ? "indented" : "scss",
			style: "expanded",
			sourceMap,
			sourceMapIncludeSources: true
		});
		file.contents = Buffer.from(result.css);
		file.extname = ".css";
		if (result.sourceMap && sourceMap) cleanSourceMap(file, JSON.parse(JSON.stringify(result.sourceMap)));
	} catch (err) {
		const error = err;
		throw new PluginError("pscss", error, { message: "Error! Sass compiler: " + error.message });
	}
}
function cleanSourceMap(file, map) {
	const basePath = file.base;
	map.file = file.relative.replace(/\\/g, "/");
	map.sources = map.sources.map((path) => {
		if (path.startsWith("file:")) path = fileURLToPath(path);
		path = relative(basePath, path);
		return path.replace(/\\/g, "/");
	});
	file.sourceMap = map;
}
//#endregion
export { pscss, rename };
