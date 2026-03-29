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
let node_stream = require("node:stream");
let plugin_error = require("plugin-error");
plugin_error = __toESM(plugin_error);
//#region src/rename.ts
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
Object.defineProperty(exports, "__toESM", {
	enumerable: true,
	get: function() {
		return __toESM;
	}
});
Object.defineProperty(exports, "rename", {
	enumerable: true,
	get: function() {
		return rename;
	}
});
