Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_buffer = require("node:buffer");
let node_path = require("node:path");
let node_stream = require("node:stream");
let node_url = require("node:url");
let _fullhuman_postcss_purgecss = require("@fullhuman/postcss-purgecss");
_fullhuman_postcss_purgecss = __toESM(_fullhuman_postcss_purgecss);
let autoprefixer = require("autoprefixer");
autoprefixer = __toESM(autoprefixer);
let cssnano = require("cssnano");
cssnano = __toESM(cssnano);
let plugin_error = require("plugin-error");
plugin_error = __toESM(plugin_error);
let postcss = require("postcss");
postcss = __toESM(postcss);
let postcss_import = require("postcss-import");
postcss_import = __toESM(postcss_import);
let postcss_nested = require("postcss-nested");
postcss_nested = __toESM(postcss_nested);
let postcss_preset_env = require("postcss-preset-env");
postcss_preset_env = __toESM(postcss_preset_env);
let sass_embedded = require("sass-embedded");
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
	const stream = new node_stream.Transform({ objectMode: true });
	stream._transform = async (file, _, callback) => {
		if (file.isNull()) return callback(null, file);
		if (file.isStream()) {
			callback(new plugin_error.default("pscss", "Streams are not supported"));
			return;
		}
		if (file.stem.startsWith("_")) {
			callback();
			return;
		}
		if (file.isBuffer()) {
			if (file.contents.length > 10 * 1024 * 1024) {
				callback(new plugin_error.default("pscss", "File too large"));
				return;
			}
			if (!loadPaths) loadPaths = [file.base, (0, node_path.join)(file.cwd, "node_modules")];
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
				throw new plugin_error.default("pscss", err, {
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
		if (isPresetEnv) postcssPlugins = [(0, postcss_import.default)(), (0, postcss_preset_env.default)()];
		else postcssPlugins = [
			(0, postcss_import.default)(),
			(0, postcss_nested.default)(),
			(0, autoprefixer.default)()
		];
		if (isPurge) {
			if (!purgeCSSoptions || typeof purgeCSSoptions !== "object" || Array.isArray(purgeCSSoptions)) throw new Error("Error! Postcss compiler: Check the type PurgeCSS options.");
			if (!purgeCSSoptions.content || !Array.isArray(purgeCSSoptions.content) || purgeCSSoptions.content.length === 0) throw new Error("Error! Postcss compiler: PurgeCSS requires a non-empty \"content\" array.");
			const purgePlagin = (0, _fullhuman_postcss_purgecss.default)(purgeCSSoptions);
			postcssPlugins.push(purgePlagin);
		}
		if (minify) postcssPlugins.push((0, cssnano.default)({ preset: ["default", {
			discardComments: { removeAll: true },
			mergeLonghand: false
		}] }));
		const result = await (0, postcss.default)(postcssPlugins).process(css, {
			from: file.path,
			to: file.path,
			map: sourceMap ? mapOptions : void 0
		});
		file.contents = node_buffer.Buffer.from(result.css);
		file.extname = ".css";
		if (result.map && sourceMap) file.sourceMap = result.map.toJSON();
	} catch (err) {
		const error = err;
		throw new plugin_error.default("pscss", error, { message: error.message });
	}
}
async function sass(file, loadPaths, sourceMap) {
	if (file.isBuffer()) try {
		const result = await (0, sass_embedded.compileStringAsync)(new TextDecoder().decode(file.contents), {
			url: (0, node_url.pathToFileURL)(file.path),
			loadPaths,
			syntax: file.extname === ".sass" ? "indented" : "scss",
			style: "expanded",
			sourceMap,
			sourceMapIncludeSources: true
		});
		file.contents = node_buffer.Buffer.from(result.css);
		file.extname = ".css";
		if (result.sourceMap && sourceMap) cleanSourceMap(file, JSON.parse(JSON.stringify(result.sourceMap)));
	} catch (err) {
		const error = err;
		throw new plugin_error.default("pscss", error, { message: "Error! Sass compiler: " + error.message });
	}
}
function cleanSourceMap(file, map) {
	const basePath = file.base;
	map.file = file.relative.replace(/\\/g, "/");
	map.sources = map.sources.map((path) => {
		if (path.startsWith("file:")) path = (0, node_url.fileURLToPath)(path);
		path = (0, node_path.relative)(basePath, path);
		return path.replace(/\\/g, "/");
	});
	file.sourceMap = map;
}
/**
* Gulp plugin for rename file - change extname or/and added suffix
* @param basename - new file name (file stem and file extension)
* @param extname - new file extension
* @param suffix - new file suffix
*/
function rename({ basename = void 0, extname = void 0, suffix = void 0 } = {}) {
	const stream = new node_stream.Transform({ objectMode: true });
	stream._transform = async (sameFile, _enc, callback) => {
		if (sameFile.isNull()) return callback(null, sameFile);
		if (sameFile.isBuffer()) try {
			const file = sameFile.clone({ contents: false });
			if (basename) file.basename = basename;
			const extName = file.extname;
			if (suffix && extname) file.extname = suffix + extname;
			else if (suffix && !extname) file.extname = suffix + extName;
			else if (!suffix && extname) file.extname = extname;
			if (file.sourceMap) file.sourceMap.file = file.relative;
			callback(null, file);
		} catch (err) {
			throw new plugin_error.default("pscss", err, {
				fileName: sameFile.path,
				showStack: true
			});
		}
		else callback(null, sameFile);
	};
	return stream;
}
//#endregion
exports.pscss = pscss;
exports.rename = rename;
