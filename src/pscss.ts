import type { RawSourceMap } from 'source-map'
import type File from 'vinyl'

import { Buffer } from 'node:buffer'
import { join, relative } from 'node:path'
import { Transform } from 'node:stream'
import { fileURLToPath, pathToFileURL } from 'node:url'

import purgeCSSPlugin, { type UserDefinedOptions } from '@fullhuman/postcss-purgecss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import PluginError from 'plugin-error'
import postcss, { type PluginCreator } from 'postcss'
import atImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssPresetEnv from 'postcss-preset-env'
import { compileStringAsync } from 'sass-embedded'

interface PscssOptions {
  minify?: boolean | undefined
  presetEnv?: boolean | undefined
  purgeCSSoptions?: UserDefinedOptions | undefined
  loadPaths?: string[] | undefined
}

interface RenameOptions {
  basename?: string | undefined
  extname?: string | undefined
  suffix?: string | undefined
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
function pscss({ minify = true, presetEnv = false, purgeCSSoptions, loadPaths }: PscssOptions = {}): Transform {
  const stream = new Transform({ objectMode: true })

  stream._transform = async (file: File, _, callback) => {
    // Skip null files
    if (file.isNull()) {
      return callback(null, file)
    }

    // Reject streams
    if (file.isStream()) {
      callback(new PluginError('pscss', 'Streams are not supported'))
      return
    }

    // Skip partials
    if (file.stem.startsWith('_')) {
      callback()
      return
    }

    if (file.isBuffer()) {
      // Validate file size (prevent DoS attacks)
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.contents.length > MAX_FILE_SIZE) {
        callback(new PluginError('pscss', 'File too large'))
        return
      }

      // Initialize loadPaths value of default
      if (!loadPaths) {
        loadPaths = [file.base, join(file.cwd, 'node_modules')]
      }
      // Initialize sourceMap as boolean
      const sourceMap = !!file.sourceMap
      // Get and normalize extname
      const extname = file.extname.split('.').pop()?.toLowerCase() ?? ''
      // Fist stage of sourcemap
      let prevSourceMap = false

      try {
        // run sass compiler for sass or scss files
        if (/^(scss|sass)$/i.test(extname)) {
          await sass(file, loadPaths, sourceMap)
          // Second stage of sourcemap
          prevSourceMap = sourceMap
        }

        // run postcss
        await post(file, minify, presetEnv, purgeCSSoptions, sourceMap, prevSourceMap)

        callback(null, file)
      } catch (err) {
        const error = err as Error
        throw new PluginError('pscss', error, { fileName: file.path, showStack: true })
      }
    }
  }
  return stream
}

// postcss compiler
async function post(
  file: File,
  minify: boolean,
  presetEnv: boolean,
  purgeCSSoptions: UserDefinedOptions | undefined,
  sourceMap: boolean,
  prevSourceMap: boolean,
): Promise<void> {
  if (file.isBuffer()) {
    try {
      const isPresetEnv = presetEnv
      const isPurge = !!purgeCSSoptions
      const prevMap = prevSourceMap ? file.sourceMap : false
      const mapOptions = { inline: false, annotation: false, prev: prevMap }

      const css = new TextDecoder().decode(file.contents)
      let postcssPlugins: postcss.AcceptedPlugin[] = []

      // use PresetEnv or not
      if (isPresetEnv) {
        postcssPlugins = [atImport(), postcssPresetEnv()]
      } else {
        postcssPlugins = [atImport(), postcssNested(), autoprefixer()]
      }

      if (isPurge) {
        // include PurgeCSS
        if (!purgeCSSoptions || typeof purgeCSSoptions !== 'object' || Array.isArray(purgeCSSoptions)) {
          throw new Error('Error! Postcss compiler: Check the type PurgeCSS options.')
        }
        // Validate required content field
        if (
          !purgeCSSoptions.content ||
          !Array.isArray(purgeCSSoptions.content) ||
          purgeCSSoptions.content.length === 0
        ) {
          throw new Error('Error! Postcss compiler: PurgeCSS requires a non-empty "content" array.')
        }
        // Insert purge plugin in postcss plugins list
        const purgePlagin = (purgeCSSPlugin as unknown as PluginCreator<UserDefinedOptions>)(purgeCSSoptions)
        postcssPlugins.push(purgePlagin)
      }

      // include cssnano
      if (minify) {
        postcssPlugins.push(
          cssnano({
            preset: [
              'default',
              {
                discardComments: { removeAll: true }, // Remove all comments
                mergeLonghand: false, // Preserve longhand for better readability
              },
            ],
          }),
        )
      }

      // run compiler
      const result = await postcss(postcssPlugins).process(css, {
        from: file.path,
        to: file.path,
        map: sourceMap ? mapOptions : undefined,
      })

      file.contents = Buffer.from(result.css)
      file.extname = '.css'

      if (result.map && sourceMap) {
        file.sourceMap = result.map.toJSON()
      }
    } catch (err) {
      const error = err as Error
      throw new PluginError('pscss', error, { message: error.message })
    }
  }
}

// sass compiler
async function sass(file: File, loadPaths: string[], sourceMap: boolean) {
  if (file.isBuffer()) {
    try {
      const content = new TextDecoder().decode(file.contents)

      const result = await compileStringAsync(content, {
        url: pathToFileURL(file.path),
        loadPaths: loadPaths,
        syntax: file.extname === '.sass' ? 'indented' : 'scss',
        style: 'expanded',
        sourceMap: sourceMap,
        sourceMapIncludeSources: true,
        silenceDeprecations: [
          'import',
          'color-functions',
          'global-builtin',
          'legacy-js-api',
          'if-function'
        ],
      })

      file.contents = Buffer.from(result.css)
      file.extname = '.css'

      if (result.sourceMap && sourceMap) {
        cleanSourceMap(file, JSON.parse(JSON.stringify(result.sourceMap)) as RawSourceMap)
      }
    } catch (err) {
      const error = err as Error
      throw new PluginError('pscss', error, { message: 'Error! Sass compiler: ' + error.message })
    }
  }
}

// Update source map
function cleanSourceMap(file: File, map: RawSourceMap) {
  const basePath = file.base
  map.file = file.relative.replace(/\\/g, '/')

  map.sources = map.sources.map((path) => {
    if (path.startsWith('file:')) {
      path = fileURLToPath(path)
    }
    path = relative(basePath, path)
    return path.replace(/\\/g, '/')
  })

  file.sourceMap = map
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
export { pscss, rename }
export type { PscssOptions, UserDefinedOptions, RenameOptions }
