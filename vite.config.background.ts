import { defineConfig } from 'vite'
import path from 'path';
import wasm from 'vite-plugin-wasm';

// https://vite.dev/config/
export default defineConfig(({ mode }) =>{
  // Determine build output directory based on mode
  const outDir = mode === 'production' ? 'release' : 'dist';

  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.wasm'],
    },
    publicDir: 'public',
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve(__dirname, './src-ts/background.ts'),
        output: {
          entryFileNames: '[name].js',
          inlineDynamicImports: true
        },
      },
      sourcemap: true,
      target: 'esnext',
      minify: mode === 'production' ? 'esbuild' : false,
      esbuild: {
        drop: mode === 'production' ? ['console'] : [],
      },
    },
    plugins: [
      wasm()
    ]
  }
})