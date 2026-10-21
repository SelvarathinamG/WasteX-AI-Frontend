/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        navy: {
          950: '#060B14',
          900: '#0A111E',
          800: '#101A2C',
          700: '#182640',
          600: '#233457'
        },
        wastex: {
          green: '#1FA971',
          greendark: '#158557',
          amber: '#D98E28',
          orange: '#D9682B',
          red: '#D63A3A'
        }
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(3,8,16,0.35)'
      }
    }
  },
  plugins: []
}
