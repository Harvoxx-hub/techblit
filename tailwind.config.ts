import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#000000', // Default text color to black
            h1: {
              color: '#000000',
              fontWeight: '700',
              fontSize: '2rem',
              marginTop: '1.5rem',
              marginBottom: '1rem',
              lineHeight: '1.2',
            },
            h2: {
              color: '#000000',
              fontWeight: '600',
              fontSize: '1.5rem',
              marginTop: '1.25rem',
              marginBottom: '0.75rem',
              lineHeight: '1.3',
            },
            h3: {
              color: '#000000',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1rem',
              marginBottom: '0.5rem',
              lineHeight: '1.4',
            },
            h4: {
              color: '#000000',
              fontWeight: '600',
              fontSize: '1.125rem',
              marginTop: '0.875rem',
              marginBottom: '0.5rem',
              lineHeight: '1.4',
            },
            h5: {
              color: '#000000',
              fontWeight: '600',
              fontSize: '1rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
              lineHeight: '1.5',
            },
            h6: {
              color: '#000000',
              fontWeight: '600',
              fontSize: '0.875rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
              lineHeight: '1.5',
            },
            p: {
              color: '#000000',
            },
            strong: {
              color: '#000000',
              fontWeight: '600',
            },
            em: {
              color: '#000000',
            },
            a: {
              color: '#2563eb',
              textDecoration: 'underline',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            code: {
              color: '#000000',
              backgroundColor: '#f3f4f6',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            pre: {
              backgroundColor: '#111827',
              color: '#f9fafb',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
            },
            blockquote: {
              borderLeftColor: '#d1d5db',
              color: '#000000', // Keep blockquotes black too
            },
            ul: {
              color: '#000000',
            },
            ol: {
              color: '#000000',
            },
            li: {
              color: '#000000',
            },
            img: {
              borderRadius: '0.5rem',
            },
            table: {
              borderCollapse: 'collapse',
            },
            'th, td': {
              borderColor: '#d1d5db',
              color: '#000000',
            },
            th: {
              backgroundColor: '#f9fafb',
              fontWeight: '600',
              color: '#000000',
            },
            hr: {
              borderColor: '#d1d5db',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
