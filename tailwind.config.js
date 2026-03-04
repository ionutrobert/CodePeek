/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/sidepanel/index.html",
    "./src/sidepanel/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // Use slate palette instead of gray for design system
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Ensure emerald is available (Tailwind has it by default)
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      }
    }
  },
  plugins: []
}
