'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WritersHeroProps {
  googleFormUrl: string;
}

export default function WritersHero({ googleFormUrl }: WritersHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const gradientVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section className="relative bg-white dark:bg-gray-900 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
      
      {/* Minimal decorative elements with animation */}
      <motion.div
        variants={gradientVariants}
        initial="hidden"
        animate="visible"
        className="absolute top-0 right-0 w-96 h-96 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-20"
      />
      <motion.div
        variants={gradientVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl opacity-20"
      />
      
      <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 lg:py-40">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="text-center"
        >
          {/* Main Title with Animation */}
          <motion.h1
            variants={titleVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white mb-6 leading-tight tracking-tight"
          >
            Become a{' '}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% auto',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              TechBlit
            </motion.span>
            {' '}Contributor
          </motion.h1>

          {/* Subtitle with staggered animation */}
          <motion.div variants={itemVariants} className="mb-8">
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
              Write, Learn, Grow, Build Your Portfolio
            </p>
          </motion.div>

          {/* Description with fade in */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Join a community of passionate writers documenting technology and innovation in Nigeria. 
              Get real industry reach, build your portfolio, and grow your skills with verified bylines.
            </p>
          </motion.div>

          {/* CTA Button with animation */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-lg font-medium text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              Apply Now
            </a>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}

