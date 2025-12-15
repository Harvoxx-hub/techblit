import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  createdAt: any;
  author?: string | { uid: string; name: string };
  excerpt?: string;
  category?: string;
  readTime?: string;
  status?: string;
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    try {
      let dateObj: Date;
      if (date.toDate) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        dateObj = new Date(date);
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }
      
      return dateObj.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  const getExcerpt = () => {
    if (post.excerpt) return post.excerpt;
    return post.content.length > 200 
      ? post.content.substring(0, 200) + '...' 
      : post.content;
  };

  return (
    <Link href={`/${post.slug}`}>
      <article className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ${
        featured ? 'border-l-4 border-blue-500' : ''
      }`}>
        <div className="p-6">
          {post.category && (
            <div className="mb-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {post.category}
              </span>
            </div>
          )}
          
          <h3 className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 ${
            featured ? 'text-xl' : 'text-lg'
          }`}>
            {post.title}
          </h3>
          
          <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
            {getExcerpt()}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {post.author && (
                <span className="font-medium">
                  {typeof post.author === 'string' ? post.author : post.author.name}
                </span>
              )}
              <time>{formatDate(post.createdAt)}</time>
              {post.readTime && (
                <span>{post.readTime} read</span>
              )}
            </div>
            <span className="text-blue-600 group-hover:text-blue-800 font-medium">
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
