// import modules
import server from '@pasmurno/serve'
import { deleteAsync } from 'del'
import { dest, series, src } from 'gulp'
import { compile } from 'tscom'
import { pscss } from '../libs/pscss.js'

// styles task
function styles() {
  return src('pcss/styles/main.pcss', { sourcemaps: true })
    .pipe(pscss({ presetEnv: true }))
    .pipe(dest('dist/css', { sourcemaps: '.' }))
}

// scripts task
async function scripts() {
  await compile({
    input: 'pcss/scripts/main.ts',
    dir: 'dist/js',
  })
}

// copy
function copy() {
  return src(['pcss/*.html', 'assets/**/*.*'], { encoding: false }).pipe(dest('dist'))
}

// clean task
async function clean() {
  await deleteAsync(['dist'])
}

// serve
async function serve() {
  await server()
}

// export
export const pcss = series(clean, copy, scripts, styles, serve)
