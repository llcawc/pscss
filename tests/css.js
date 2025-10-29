// import modules
import server from '@pasmurno/serve'
import { deleteAsync } from 'del'
import { dest, series, src } from 'gulp'
import { compile } from 'tscom'
import { pscss } from '../libs/pscss.js'

// styles task
function styles() {
  return src('css/styles/main.css', { sourcemaps: true })
    .pipe(pscss())
    .pipe(dest('dist/css', { sourcemaps: true }))
}

// scripts task
async function scripts() {
  await compile({
    input: 'css/scripts/main.ts',
    dir: 'dist/js',
  })
}

// copy
function copy() {
  return src(['css/*.html', 'assets/**/*.*'], { encoding: false }).pipe(dest('dist'))
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
export const css = series(clean, copy, scripts, styles, serve)
