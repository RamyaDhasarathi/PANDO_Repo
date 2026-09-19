/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1e1e22",
        paper: "#f1eef2",
        acid: "#c5a059",
        signal: "#d22c23",
        water: "#4e7d63",
        sage: "#b9d9c8",
        lavender: "#e8e4eb",
        hp: {
          primary: "#d22c23",
          "primary-dark": "#8f1620",
          "primary-light": "#e05252",
          gold: "#c5a059",
          "mint-50": "#fdf3f2",
          "mint-100": "#fbe4e1",
          "mint-200": "#f5c6c0",
          charcoal: "#29352f",
          slate: "#5c6b64",
          line: "rgba(30, 30, 34, 0.2)",
          "line-soft": "rgba(30, 30, 34, 0.1)",
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'hp-sm': '0 1px 2px rgba(30, 30, 34, 0.06)',
        'hp-md': '0 8px 24px rgba(30, 30, 34, 0.08)',
        'hp-lg': '0 20px 48px rgba(30, 30, 34, 0.14)',
      },
      borderRadius: {
        'hp-sm': '10px',
        'hp-md': '16px',
        'hp-lg': '24px',
        'hp-pill': '999px',
      },
      spacing: {
        'hp-1': '4px',
        'hp-2': '8px',
        'hp-3': '12px',
        'hp-4': '16px',
        'hp-5': '24px',
        'hp-6': '32px',
        'hp-7': '48px',
        'hp-8': '64px',
      },
      maxWidth: {
        'hp-container': '1240px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        pandoFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        speechAppear: {
          'from': { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(210,44,35,0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(210,44,35,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(210,44,35,0)' },
        },
        pandoPinBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-13px)' },
          '70%': { transform: 'translateY(2px)' },
        },
        'mascot-twist': {
          '0%, 100%': { transform: 'rotate(0) translateX(0)' },
          '25%': { transform: 'rotate(-7deg) translateX(-10px)' },
          '55%': { transform: 'rotate(8deg) translateX(12px)' },
          '78%': { transform: 'rotate(-4deg) translateX(-5px)' },
        },
        'mascot-jump': {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '25%': { transform: 'translateY(-34px) rotate(-3deg)' },
          '48%': { transform: 'translateY(0) rotate(3deg)' },
          '62%': { transform: 'translateY(-16px) rotate(-2deg)' },
          '80%': { transform: 'translateY(0) rotate(0)' },
        },
        'mascot-dance': {
          '0%, 100%': { transform: 'rotate(0) translateX(0) scaleX(1)' },
          '20%': { transform: 'rotate(-5deg) translateX(-10px) scaleX(0.98)' },
          '42%': { transform: 'rotate(6deg) translateX(10px) scaleX(1.02)' },
          '64%': { transform: 'rotate(-4deg) translateX(-8px) scaleX(0.99)' },
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pandoFloat: 'pandoFloat 4s ease-in-out infinite',
        speechAppear: 'speechAppear 0.4s ease forwards',
        pulse: 'pulse 2s infinite',
        pandoPinBounce: 'pandoPinBounce 0.8s ease',
        'mascot-twist': 'mascot-twist 2.2s ease-in-out both',
        'mascot-jump': 'mascot-jump 2.2s cubic-bezier(0.2, 0.8, 0.3, 1) both',
        'mascot-dance': 'mascot-dance 2.2s ease-in-out both',
      }
    },
  },
  plugins: [],
}

// trigger rebuild
