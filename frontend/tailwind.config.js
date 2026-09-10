/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#12355B',          // Primary Navy
          navyDark: '#0B233D',      // Dark Navy (Hover/Active)
          navyLight: '#184576',     // Medium Navy
          blue: '#1F4E79',          // Secondary Institutional Blue
          blueLight: '#EBF3FA',     // Soft Blue Background Tint
          blueHover: '#173B5C',     // Darker Blue
          bg: '#F4F6F8',            // Light Page Background
          surface: '#FFFFFF',       // Clean White Surface Panel
          surfaceSubtle: '#F8FAFC', // Subtle Gray/White Table Header
          text: '#1F2937',          // Primary High-Contrast Text
          textSecondary: '#5B6573', // Secondary Label / Timestamp Text
          textMuted: '#8A94A6',     // Muted Hint Text
          border: '#D9DEE5',        // Standard 1px Divider / Border
          borderSubtle: '#E5E7EB',  // Subtle Line Border
          borderDark: '#B8C2CC',    // Focused Border
          saffron: '#F28C28',       // Saffron Accent
          saffronLight: '#FEF3E9',  // Saffron Tint
          saffronBorder: '#FBD8B7', // Saffron Border
          green: '#198754',         // Success / Online / Healthy Green
          greenLight: '#E8F5E9',    // Green Tint
          greenBorder: '#C8E6C9',   // Green Border
          greenDark: '#12633D',     // Darker Green Text
          amber: '#D99A00',         // Warning Amber
          amberLight: '#FFF8E1',    // Amber Tint
          amberBorder: '#FFE082',   // Amber Border
          amberDark: '#B78103',     // Darker Amber Text
          red: '#C62828',           // Critical / Alert Red
          redLight: '#FFEBEE',      // Red Tint
          redBorder: '#FFCDD2',     // Red Border
          redDark: '#9A1E1E',       // Darker Red Text
          info: '#1976A8',          // Info Blue
          infoLight: '#E1F5FE',     // Info Tint
          infoBorder: '#B3E5FC',    // Info Border
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'panel': '0 1px 3px 0 rgba(18, 53, 91, 0.06), 0 1px 2px -1px rgba(18, 53, 91, 0.04)',
        'modal': '0 10px 25px -5px rgba(18, 53, 91, 0.2), 0 8px 10px -6px rgba(18, 53, 91, 0.15)',
      }
    },
  },
  plugins: [],
}
