import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // Développement : l'API est servie par Django sur le port 8000.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/lib/**', 'src/app/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/test/**',
        // Déclarations seules : types et table de routage, sans logique à couvrir.
        'src/lib/types.ts',
        'src/app/routes.tsx',
      ],
      // Seuil du cahier des charges : 70 % sur features/ et lib/.
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
})
