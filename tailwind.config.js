/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',       // Indigo (matches Flutter theme)
        accent: '#00D2D3',        // Teal
        background: '#0A0A1A',   // Deep dark
        surface: '#1A1A2E',      // Card surface
        surfaceElevated: '#16213E',
        error: '#FF6B6B',
        warning: '#FFC107',
        success: '#51CF66',
        textPrimary: '#FFFFFF',
        textSecondary: '#B0B3C8',
        textMuted: '#6B6F8A',
        border: 'rgba(108, 92, 231, 0.3)',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        chip: '20px',
      },
    },
  },
  plugins: [],
};
