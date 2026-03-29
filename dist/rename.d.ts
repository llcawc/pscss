import { Transform } from "node:stream";

//#region src/rename.d.ts
interface RenameOptions {
  basename?: string | undefined;
  extname?: string | undefined;
  suffix?: string | undefined;
}
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
export { type RenameOptions, rename };