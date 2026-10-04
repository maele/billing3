/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/templates/**/*.html',
    './app/templates/**/*.jinja',
    './app/static/js/**/*.js',
    './app/blueprints/**/*.py',
    './app/**/*.py',
  ],
  safelist: [
    // Classes only ever used as runtime-constructed strings
    { pattern: /^border-l-(brand-500|emerald-500|red-500)$/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        slidein: {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to:   { transform: 'none', opacity: '1' },
        },
        fadein: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        slidein: 'slidein .2s ease',
        fadein:  'fadein .15s ease',
      },
    },
  },
  plugins: [],
};
