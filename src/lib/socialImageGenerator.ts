/**
 * Social Media Image Generator (Client-side)
 * 
 * Generates social media images for published articles using the Tech News template.
 * Creates 1080x1080px images with logo, headline, and background image.
 */

// Canvas dimensions
const width = 1080;
const height = 1080;

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

/**
 * Get logo URL
 */
function getLogoUrl(): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com';
  return `${baseUrl}/logo.png`;
}

/**
 * Extract background image URL from featuredImage field
 */
function extractBackgroundImageUrl(featuredImage: any): string | null {
  if (!featuredImage) {
    return null;
  }

  if (typeof featuredImage === 'string') {
    return featuredImage;
  }

  if (featuredImage.url) {
    return featuredImage.url;
  }

  if (featuredImage.original && featuredImage.original.url) {
    return featuredImage.original.url;
  }

  if (featuredImage.ogImage && featuredImage.ogImage.url) {
    return featuredImage.ogImage.url;
  }

  if (featuredImage.secure_url) {
    return featuredImage.secure_url;
  }

  return null;
}

/**
 * Generate social media image for an article
 * Follows the structured guide provided
 */
export async function generateSocialMediaImage(
  headline: string,
  backgroundImageUrl: string | null = null,
  logoUrl?: string,
  category: string = 'TECH NEWS'
): Promise<Blob> {
  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 1. Draw background image
  if (backgroundImageUrl) {
    try {
      const background = await loadImage(backgroundImageUrl);
      ctx.drawImage(background, 0, 0, width, height);
    } catch (error) {
      console.warn('Failed to load background image, using gradient:', error);
      // Fallback to gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Add dark overlay (bottom half only)
  // Gradient from y=540 (middle) to y=1080 (bottom)
  const overlayStartY = 540;
  const overlayEndY = height;
  const gradient = ctx.createLinearGradient(0, overlayStartY, 0, overlayEndY);
  
  // Color stops as specified: transparent at start, gradually darker towards bottom
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');        // Transparent at start (y=540)
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)');    // 30% opacity
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');    // 60% opacity
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');     // 85% opacity at bottom
  
  ctx.fillStyle = gradient;
  // Only fill the bottom half of the canvas
  ctx.fillRect(0, overlayStartY, width, overlayEndY - overlayStartY);

  // 3. Draw logo
  const finalLogoUrl = logoUrl || getLogoUrl();
  try {
    const logo = await loadImage(finalLogoUrl);
    const logoWidth = 150;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    ctx.drawImage(logo, 70, 70, logoWidth, logoHeight);
  } catch (error) {
    console.error('Failed to load logo:', error);
    throw new Error(`Failed to load logo from ${finalLogoUrl}`);
  }

  // 4. Draw category text (e.g., "TECH NEWS")
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  
  // HTML5 Canvas doesn't support letterSpacing directly, so we implement it manually
  const categoryText = category.toUpperCase();
  const letterSpacing = 8;
  
  // Calculate total width with letter spacing
  let totalWidth = 0;
  for (let i = 0; i < categoryText.length; i++) {
    totalWidth += ctx.measureText(categoryText[i]).width;
    if (i < categoryText.length - 1) {
      totalWidth += letterSpacing;
    }
  }
  
  // Start position (centered)
  let xPos = (width - totalWidth) / 2;
  ctx.textAlign = 'left';
  
  // Draw each character with spacing
  for (let i = 0; i < categoryText.length; i++) {
    ctx.fillText(categoryText[i], xPos, 680);
    xPos += ctx.measureText(categoryText[i]).width + letterSpacing;
  }

  // 5. Draw divider line
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 750);
  ctx.lineTo(width - 60, 750);
  ctx.stroke();

  // 6. Draw main headline with word wrapping
  ctx.font = '900 52px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  
  const maxWidth = 960;
  const lineHeight = 68;
  let y = 830;
  
  // Split headline and highlight hashtags/numbers
  const headlineText = headline.toUpperCase();
  const words = headlineText.split(' ');
  let line = '';
  const lines: string[] = [];
  
  // Word wrap logic
  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  
  // Draw each line with highlighting
  lines.forEach((line, index) => {
    const lineY = y + (index * lineHeight);
    const parts = line.split(/(\#[A-Z0-9]+|\d+[\w-]*)/g);
    
    let currentX = width / 2;
    
    // Calculate total width to center properly
    let totalWidth = 0;
    parts.forEach(part => {
      totalWidth += ctx.measureText(part).width;
    });
    
    currentX = (width - totalWidth) / 2;
    
    parts.forEach(part => {
      // Check if it's a hashtag or number
      if (part.match(/\#[A-Z0-9]+/) || part.match(/^\d+/)) {
        ctx.fillStyle = '#FFD700'; // Yellow
      } else {
        ctx.fillStyle = '#FFFFFF'; // White
      }
      
      ctx.textAlign = 'left';
      ctx.fillText(part, currentX, lineY);
      currentX += ctx.measureText(part).width;
    });
  });

  // 7. Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Generate social media image from post data
 */
export async function generateSocialMediaImageFromPost(post: {
  title: string;
  category?: string;
  featuredImage?: any;
}): Promise<Blob> {
  const headline = post.title || 'Tech News';
  const category = post.category || 'TECH NEWS';
  const backgroundImageUrl = extractBackgroundImageUrl(post.featuredImage);
  
  return generateSocialMediaImage(headline, backgroundImageUrl, undefined, category);
}
