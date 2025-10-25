// Enable dynamic params for client-side routing
export const dynamicParams = true;

// Generate static params (empty for client-side handling)
export async function generateStaticParams() {
  // Return empty array - all category slugs will be handled client-side
  return [];
}

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

