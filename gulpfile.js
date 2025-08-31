// import modules
import server from '@pasmurno/serve'
import { deleteSync as del } from 'del'
import { dest, parallel, series, src, watch } from 'gulp'
import { pscss, rename } from './libs/pscss.js'

// css task
function css() {
  return src(['src/styles/style.css'], { sourcemaps: true })
    .pipe(
      pscss({
        purgeCSSoptions: {
          content: ['src/*.html', 'src/js/*.js'],
          variables: true,
          fontFace: true,
        },
      })
    )
    .pipe(rename({ basename: 'main.css' }))
    .pipe(dest('dist/css', { sourcemaps: true }))
}

// clear dist
function clear(cb) {
  del('dist')
  return cb()
}

// copy assets
function assets() {
  return src(['src/**/*.*', '!src/styles', '!src/styles/**/*.*'], { encoding: false }).pipe(dest('dist'))
}

// browse dist
async function serve() {
  await server()
}

function watcher(cb) {
  watch('src/styles/**/*.*', css)
  cb()
}

// export
export { assets }
export const dev = series(clear, parallel(assets, css, watcher, serve))
export const build = series(clear, parallel(assets, css))
