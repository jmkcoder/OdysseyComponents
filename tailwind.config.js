/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.html',
    './src/**/*.ts',
    './src/**/*.js',
    './src/**/*.tsx',
    './src/**/*.jsx',
  ],
  theme: {
    extend: {
      // Custom width values
      width: {
        '50': '50px',
        '100': '100px',
        '150': '150px',
        '200': '200px',
        '250': '250px',
        '300': '300px',
        '400': '400px',
        '500': '500px',
      },
      // Custom height values
      height: {
        '50': '50px',
        '100': '100px',
        '150': '150px',
        '200': '200px',
        '250': '250px',
        '300': '300px',
        '400': '400px',
        '500': '500px',
      },
      // Custom spacing (margin, padding)
      spacing: {
        '50': '50px',
        '100': '100px',
        '150': '150px',
        '200': '200px',
      },
      // Custom flex values
      flex: {
        '2': '2 2 0%',
        '3': '3 3 0%',
        '4': '4 4 0%',
      },
    },
  },
  plugins: [],
  // Safelist ensures these classes are generated even if not detected in content files
  safelist: [
    // Width utilities
    { pattern: /^w-/ },
    // Height utilities
    { pattern: /^h-/ },
    // Padding utilities
    { pattern: /^p-/ },
    { pattern: /^px-/ },
    { pattern: /^py-/ },
    { pattern: /^pt-/ },
    { pattern: /^pr-/ },
    { pattern: /^pb-/ },
    { pattern: /^pl-/ },
    // Margin utilities
    { pattern: /^m-/ },
    { pattern: /^mx-/ },
    { pattern: /^my-/ },
    { pattern: /^mt-/ },
    { pattern: /^mr-/ },
    { pattern: /^mb-/ },
    { pattern: /^ml-/ },
    // Flex utilities
    { pattern: /^flex-/ },
    // Grid utilities
    { pattern: /^grid-/ },
    // Gap utilities
    { pattern: /^gap-/ },
    // Border utilities
    { pattern: /^border/ },
    // Background utilities
    { pattern: /^bg-/ },
    // Text utilities
    { pattern: /^text-/ },
  ],
}

