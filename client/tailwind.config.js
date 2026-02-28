// Configuración de Tailwind CSS — mobile-first con colores personalizados
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales de la app
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Color secundario para acentos
        accent: {
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        // Fondo oscuro personalizado
        dark: {
          100: '#374151',
          200: '#1f2937',
          300: '#111827',
          400: '#0d1117',
        }
      },
      // Animación de pulso para el pin del usuario
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
