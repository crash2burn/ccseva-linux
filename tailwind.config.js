import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'claude-orange': '#FF6B35',
        'claude-blue': '#1E3A8A',
        'menu-bg': '#2D2D2D',
        'menu-hover': '#3D3D3D',
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    typography,
  ],
}