import { Transform } from 'node:stream'
import PluginError from 'plugin-error'
import File from 'vinyl'

/**
 * Gulp plugin for rename file - change extname or/and added suffix
 * @param basename - new file name
 * @param extname - new file extension
 * @param suffix - new file suffix
 */

export default function rename({
  basename = undefined,
  extname = undefined,
  suffix = undefined,
}: { basename?: string | undefined; extname?: string | undefined; suffix?: string | undefined } = {}) {
  const stream = new Transform({ objectMode: true })

  stream._transform = async (sameFile: File, _, callback) => {
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
        }
        if (suffix && !extname) {
          file.extname = suffix + extName
        }

        if (!suffix && extname) {
          file.extname = extname
        }

        // rename sourcemap
        if (file.sourceMap) {
          file.sourceMap.file = file.relative
        }
        callback(null, file)
      } catch (err) {
        const error = new PluginError('pscss', 'Error!\n', {
          message: (err as Error).message,
          stack: (err as Error).stack,
          fileName: sameFile.path,
        })
        callback(error)
      }
    }
  }
  return stream
}
