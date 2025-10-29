// import modules
import server from '@pasmurno/serve'
import { deleteAsync } from 'del'
import { dest, series, src } from 'gulp'
import { compile } from 'tscom'
import { pscss } from '../libs/pscss.js'

const purge = {
  content: [
    'sass/**/*.{ts,html}',
    'vendor/bootstrap/js/dist/dom/*.js',
    'vendor/bootstrap/js/dist/{alert,base-component,button,collapse,dropdown}.js',
  ],
  safelist: [/scrolltotop$/, /on$/, /down$/],
  keyframes: true,
  variables: true,
}

// styles task
function styles() {
  return src('sass/styles/main.sass', { sourcemaps: true })
    .pipe(pscss({ purgeCSSoptions: purge }))
    .pipe(dest('dist/css', { sourcemaps: '.' }))
}

// scripts task
async function scripts() {
  await compile({
    input: 'sass/scripts/main.ts',
    dir: 'dist/js',
  })
}

// copy
function copy() {
  return src(['sass/*.html', 'assets/{images,fonts}/*.*'], { encoding: false }).pipe(dest('dist'))
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
export const sass = series(clean, copy, scripts, styles, serve)
