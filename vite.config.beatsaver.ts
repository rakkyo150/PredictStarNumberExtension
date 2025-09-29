import { defineConfig } from 'vite';
import path from 'path';
import wasm from 'vite-plugin-wasm';

// Viteは通常BrowserターゲットなのでbackgroundはwebworkerとしてCargo.tomlやRust側でビルド要
// Worker内コードはimport.meta.env.MODE 等で判別して処理を分ける対応が必要
export default defineConfig(({ mode }) => {
  // Define multiple entry points
  const input = {
    BeatSaver: path.resolve(__dirname, './src-ts/BeatSaver.ts'),
  };

  // Determine build output directory based on mode
  const outDir = mode === 'production' ? 'release' : 'dist';

  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.wasm'],
    },
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        input,
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
  }
});
