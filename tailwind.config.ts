import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#e6ebff',
          200: '#c2ceff',
          300: '#9eaefc',
          400: '#7f8af5',
          500: '#5d63ec',
          600: '#463fd6',
          700: '#372fb0',
          800: '#26227d',
          900: '#18184d'
        }
      }
    }
  }
}
