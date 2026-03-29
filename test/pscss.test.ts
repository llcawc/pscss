import File from 'vinyl'
import { describe, it, expect } from 'vitest'

import { pscss } from '../src/pscss.js'

describe('pscss', () => {
  it('should process plain CSS file', async () => {
    const stream = pscss({ minify: false })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('body { color: red; }'),
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
    expect(result.contents).toBeInstanceOf(Buffer)
    const css = result.contents!.toString('utf8')
    expect(css).toContain('body')
    expect(css).toContain('color: red')
  })

  it('should minify CSS when minify=true', async () => {
    const stream = pscss({ minify: true })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('body { color: red; }'),
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

    const css = result.contents!.toString('utf8')
    // cssnano will remove whitespace and maybe semicolon
    expect(css).toMatch(/body{color:red}/)
  })

  it('should process SCSS file', async () => {
    const stream = pscss({ minify: false })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.scss',
      contents: Buffer.from('$color: red; body { color: $color; }'),
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
    const css = result.contents!.toString('utf8')
    expect(css).toContain('body')
    expect(css).toContain('color: red')
  })

  it('should skip partial files (starting with underscore)', async () => {
    const stream = pscss()
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/_partial.scss',
      contents: Buffer.from('body { color: red; }'),
    })

    const result = await new Promise<File | undefined>((resolve, reject) => {
      stream._transform(file, 'utf8', (err, transformed) => {
        if (err) {
          reject(err)
        } else {
          // transformed is undefined because partials are skipped
          resolve(transformed)
        }
      })
    })

    // Should skip (callback called without file)
    expect(result).toBeUndefined()
  })

  it('should reject stream files', async () => {
    const stream = pscss()
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: null,
    })
    Object.defineProperty(file, 'isStream', { value: () => true })
    Object.defineProperty(file, 'isBuffer', { value: () => false })
    Object.defineProperty(file, 'isNull', { value: () => false })

    await expect(
      new Promise((resolve, reject) => {
        stream._transform(file, 'utf8', (err, transformed) => {
          if (err) {
            reject(err)
          } else {
            resolve(transformed)
          }
        })
      }),
    ).rejects.toThrow('Streams are not supported')
  })

  it('should reject file too large', async () => {
    const stream = pscss()
    // Create a buffer larger than 10MB
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x')
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: hugeBuffer,
    })

    await expect(
      new Promise((resolve, reject) => {
        stream._transform(file, 'utf8', (err, transformed) => {
          if (err) {
            reject(err)
          } else {
            resolve(transformed)
          }
        })
      }),
    ).rejects.toThrow('File too large')
  })

  it('should handle null file', async () => {
    const stream = pscss()
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

  // Note: purgeCSS requires content array, we can test with dummy content
  it.skip('should process with purgeCSS options', async () => {
    const stream = pscss({
      purgeCSSoptions: {
        content: ['/test/index.html'],
      },
    })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('body { color: red; } .unused { display: none; }'),
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

    const css = result.contents!.toString('utf8')
    // purgeCSS will remove .unused because content doesn't reference it
    expect(css).not.toContain('unused')
    expect(css).toContain('body')
  })

  it.skip('should throw error if purgeCSS content is invalid', async () => {
    const stream = pscss({
      purgeCSSoptions: {
        content: [], // empty array
      },
    })
    const file = new File({
      cwd: '/',
      base: '/test',
      path: '/test/style.css',
      contents: Buffer.from('body { color: red; }'),
    })

    await expect(
      new Promise((resolve, reject) => {
        stream._transform(file, 'utf8', (err, transformed) => {
          if (err) {
            reject(err)
          } else {
            resolve(transformed)
          }
        })
      }),
    ).rejects.toThrow('PurgeCSS requires a non-empty "content" array')
  })
})
