import type File from 'vinyl'

import { Transform } from 'node:stream'

import PluginError from 'plugin-error'

interface RenameOptions {
  basename?: string | undefined
  extname?: string | undefined
  suffix?: string | undefined
}

/**
 * Gulp plugin for rename file - change extname or/and added suffix
 * @param basename - new file name (file stem and file extension)
 * @param extname - new file extension
 * @param suffix - new file suffix
 */
function rename({ basename = undefined, extname = undefined, suffix = undefined }: RenameOptions = {}): Transform {
  const stream = new Transform({ objectMode: true })

  stream._transform = async (sameFile: File, _enc, callback) => {
    // empty
    if (sameFile.isNull()) {
      return callback(null, sameFile)
    }
    // rename
    if (sameFile.isBuffer()) {
      try {
        const file = sameFile.clone({ contents: false })

        if (basename) {
          file.basename = basename
        }

        const extName = file.extname

        if (suffix && extname) {
          file.extname = suffix + extname
        } else if (suffix && !extname) {
          file.extname = suffix + extName
        } else if (!suffix && extname) {
          file.extname = extname
        }

        // rename sourcemap
        if (file.sourceMap) {
          file.sourceMap.file = file.relative
        }
        callback(null, file)
      } catch (err) {
        const error = err as Error
        throw new PluginError('pscss', error, { fileName: sameFile.path, showStack: true })
      }
    } else {
      // non-buffer files (streams) pass through unchanged
      callback(null, sameFile)
    }
  }
  return stream
}

// export
export { rename }
export type { RenameOptions }
