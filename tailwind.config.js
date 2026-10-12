import { heroui } from '@heroui/react';
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: { fontFamily: { sans: ['Outfit', 'sans-serif'] } } },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: '#c94b20', foreground: '#fffaf0' },
            background: '#faf7ef',
            foreground: '#172c32',
          },
        },
      },
    }),
  ],
};
