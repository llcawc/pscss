import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/pscss.ts'],
  format: {
    esm: {
      fixedExtension: false,
      target: ['esnext'],
    },
    cjs: {
      target: ['node20'],
    },
  },
  dts: {
    tsgo: true,
  },
  exports: true,
})
