import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#c5d9f7',
          200: '#9ebef0',
          300: '#6e9ee8',
          400: '#4a85e2',
          500: '#1a5276',
          600: '#15445f',
          700: '#0f3649',
          800: '#0a2836',
          900: '#051a24',
        },
        secondary: {
          50: '#e8f8e8',
          100: '#c5efc5',
          200: '#9ee59e',
          300: '#6ed96e',
          400: '#4acf4a',
          500: '#27ae60',
          600: '#1e8f4e',
          700: '#166f3c',
          800: '#0e502b',
          900: '#07301a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
