import File from 'vinyl'
import { describe, it, expect } from 'vitest'

import { rename } from '../src/pscss.js'

describe('rename', () => {
  it('should rename file with basename', async () => {
    const stream = rename({ basename: 'newfile.css' })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/oldfile.css',
      contents: Buffer.from('content'),
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    expect(result.basename).toBe('newfile.css')
    // normalize path separators
    expect(result.path.replace(/\\/g, '/')).toBe('/test/newfile.css')
  })

  it('should rename file with suffix and extname', async () => {
    const stream = rename({ suffix: '.min', extname: '.css' })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('content'),
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    // vinyl treats the last dot as extension separator
    // suffix + extname results in basename style.min.css, extname .css
    expect(result.extname).toBe('.css')
    expect(result.basename).toBe('style.min.css')
  })

  it('should rename file with suffix only', async () => {
    const stream = rename({ suffix: '.min' })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('content'),
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    expect(result.extname).toBe('.css')
    expect(result.basename).toBe('style.min.css')
  })

  it('should rename file with extname only', async () => {
    const stream = rename({ extname: '.min.css' })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('content'),
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    // vinyl splits basename at last dot, so extname becomes .css
    expect(result.extname).toBe('.css')
    expect(result.basename).toBe('style.min.css')
  })

  it('should keep sourcemap file name updated', async () => {
    const stream = rename({ suffix: '.min' })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('content'),
      sourceMap: {
        version: 3,
        sources: [],
        mappings: '',
        file: 'style.css',
      },
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    expect(result.sourceMap?.file).toBe('style.min.css')
  })

  it('should handle null file', async () => {
    const stream = rename()
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: null,
    })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    expect(result.contents).toBeNull()
  })

  // Note: vinyl stream not supported, but rename passes them through
  it('should handle stream file (should not happen but test)', async () => {
    const stream = rename()
    // Create a file with stream contents (simulate)
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: null,
    })
    // Override methods to simulate stream
    Object.defineProperty(file, 'isStream', { value: () => true })
    Object.defineProperty(file, 'isBuffer', { value: () => false })
    Object.defineProperty(file, 'isNull', { value: () => false })

    const result = await new Promise<File>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          resolve(transformed)
        }
      })
    })

    // Should pass through unchanged
    expect(result).toBe(file)
  })
})
