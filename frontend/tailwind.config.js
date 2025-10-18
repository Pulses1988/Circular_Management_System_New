/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'media',
 theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn 0.6s ease-out',
        'error-slide': 'errorSlide 0.3s ease-out forwards',
      },
      keyframes: {
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        errorSlide: {
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      backdropBlur: {
        'lg': '10px',
      }
    },
  },
  plugins: [],
}