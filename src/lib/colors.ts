// Techblit Brand Colors
// Based on actual brand colors: Primary #00102B, Secondary #F2C200
export const brandColors = {
  // Primary Colors (Dark Navy Blue #00102B)
  primary: {
    50: '#f0f2ff',
    100: '#e0e5ff', 
    200: '#c7d1ff',
    300: '#a5b3ff',
    400: '#7c8bff',
    500: '#00102B', // Main primary - Dark Navy Blue
    600: '#000e26',
    700: '#000c21',
    800: '#000a1c',
    900: '#000817',
  },
  
  // Secondary Colors (Bright Yellow/Gold #F2C200)
  secondary: {
    50: '#fffdf0',
    100: '#fffbe0',
    200: '#fff6c0',
    300: '#fff0a0',
    400: '#f9d571',
    500: '#F2C200', // Main secondary - Bright Yellow/Gold
    600: '#d9a800',
    700: '#c08f00',
    800: '#a67600',
    900: '#8c5d00',
  },
  
  // Accent Colors (green for growth/success)
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main accent
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

// CSS Custom Properties for easy theming
export const cssVariables = {
  '--color-primary': brandColors.primary[500],
  '--color-primary-dark': brandColors.primary[600],
  '--color-primary-light': brandColors.primary[400],
  '--color-secondary': brandColors.secondary[500],
  '--color-secondary-dark': brandColors.secondary[600],
  '--color-secondary-light': brandColors.secondary[400],
  '--color-accent': brandColors.accent[500],
  '--color-accent-dark': brandColors.accent[600],
  '--color-accent-light': brandColors.accent[400],
};

// Tailwind color classes for easy use
export const tailwindColors = {
  primary: 'text-blue-600 bg-blue-600 border-blue-600',
  secondary: 'text-orange-600 bg-orange-600 border-orange-600',
  accent: 'text-green-600 bg-green-600 border-green-600',
  primaryHover: 'hover:text-blue-700 hover:bg-blue-700',
  secondaryHover: 'hover:text-orange-700 hover:bg-orange-700',
  accentHover: 'hover:text-green-700 hover:bg-green-700',
};

// Gradient combinations using actual brand colors
export const gradients = {
  primary: 'from-[#00102B] to-[#000a1c]',
  secondary: 'from-[#F2C200] to-[#d9a800]',
  accent: 'from-green-500 to-green-600',
  primarySecondary: 'from-[#00102B] to-[#F2C200]',
  primaryAccent: 'from-[#00102B] to-green-500',
  secondaryAccent: 'from-[#F2C200] to-green-500',
  hero: 'from-[#00102B] via-[#000e26] to-[#F2C200]/30',
}

export const getCategoryGradient = (categorySlug?: string): string => {
  const slug = categorySlug?.toLowerCase()
  switch (slug) {
    case 'startup': return 'from-[#00102B] to-indigo-800'
    case 'tech-news':
    case 'tech news': return 'from-[#00102B] to-blue-700'
    case 'funding': return 'from-[#00102B] to-[#F2C200]/60'
    case 'insights': return 'from-[#00102B] to-purple-800'
    case 'events': return 'from-[#00102B] to-rose-800'
    case 'fintech': return 'from-[#00102B] to-cyan-800'
    case 'ai-innovation': return 'from-[#00102B] to-teal-700'
    case 'developer-tools': return 'from-[#00102B] to-emerald-700'
    case 'opinions': return 'from-[#00102B] to-orange-700'
    case 'brand-press':
    case 'brand press': return 'from-[#00102B] to-slate-700'
    default: return 'from-[#00102B] to-slate-800'
  }
}
