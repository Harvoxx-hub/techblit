# TechBlit - Next.js Tech Blog

A modern, SEO-ready tech blog built with Next.js 15, TypeScript, TailwindCSS, and Firebase.

## 🚀 Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Firebase SDK** for backend services
- **next-seo** for SEO optimization
- **next-sitemap** for automatic sitemap generation
- **react-markdown** for markdown content rendering
- **next/image** for optimized images

## 📦 Installation

The project has been set up with all dependencies installed. To get started:

1. **Clone and navigate to the project:**
   ```bash
   cd techblit
   ```

2. **Install dependencies (already done):**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Site Configuration
   SITE_URL=https://techblit.com
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postbuild` - Generate sitemap after build

## 📁 Project Structure

```
techblit/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles with TailwindCSS
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   └── lib/                 # Utility files
│       ├── firebase.ts      # Firebase configuration
│       └── seo.ts          # SEO configuration
├── public/                  # Static assets
├── tailwind.config.ts       # TailwindCSS configuration
├── next-sitemap.config.js   # Sitemap configuration
└── package.json
```

## 🔧 Configuration Files

- **TailwindCSS**: Configured with proper content paths
- **Firebase**: Ready for configuration with environment variables
- **SEO**: Basic SEO setup with next-seo
- **Sitemap**: Automatic sitemap generation with next-sitemap

## ⚠️ Important Notes

- **Node.js Version**: This project requires Node.js >=20.9.0 for optimal performance
- **Firebase Setup**: You'll need to create a Firebase project and configure the environment variables
- **SEO**: Update the SEO configuration in `src/lib/seo.ts` with your actual site information

## 🚀 Next Steps

1. Set up your Firebase project
2. Configure environment variables
3. Customize the SEO settings
4. Start building your tech blog!

Happy coding! 🎉
