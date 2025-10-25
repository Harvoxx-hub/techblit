// Sample blog posts data for Firestore
export const samplePosts = [
  {
    id: "getting-started-with-nextjs",
    title: "Getting Started with Next.js 14: A Complete Guide",
    content: `Next.js 14 has brought some exciting new features that make building React applications even more powerful and efficient. In this comprehensive guide, we'll explore everything you need to know to get started with Next.js 14.

## What's New in Next.js 14?

Next.js 14 introduces several key improvements:

### 1. Turbopack (Beta)
Turbopack is a new bundler that's up to 10x faster than Webpack for large applications. While still in beta, it shows incredible promise for development speed.

### 2. Server Actions
Server Actions allow you to run server-side code directly from your components, making it easier to handle form submissions and data mutations.

### 3. Partial Prerendering
This new feature allows you to prerender parts of your page while keeping other parts dynamic, giving you the best of both worlds.

## Setting Up Your First Next.js 14 Project

Let's create a new Next.js project:

\`\`\`bash
npx create-next-app@latest my-nextjs-app
cd my-nextjs-app
npm run dev
\`\`\`

## Key Concepts to Master

1. **App Router**: The new routing system based on the file system
2. **Server Components**: Components that render on the server
3. **Client Components**: Components that render on the client
4. **Middleware**: Functions that run before requests are completed

## Best Practices

- Use Server Components by default
- Only use Client Components when you need interactivity
- Leverage Server Actions for data mutations
- Take advantage of the new caching strategies

Next.js 14 represents a significant step forward in React development. With its improved performance, better developer experience, and powerful new features, it's an excellent choice for your next project.`,
    author: "Sarah Johnson",
    excerpt: "Learn how to build modern React applications with Next.js 14's latest features including Turbopack, Server Actions, and Partial Prerendering.",
    category: "Web Development",
    readTime: "8 min",
    createdAt: new Date("2024-01-15")
  },
  {
    id: "firebase-authentication-guide",
    title: "Complete Firebase Authentication Guide for React Apps",
    content: `Firebase Authentication provides a comprehensive authentication solution for web and mobile applications. In this guide, we'll walk through implementing Firebase Auth in a React application.

## Why Firebase Authentication?

Firebase Auth offers several advantages:
- Multiple authentication providers
- Secure token management
- Easy integration with other Firebase services
- Built-in security features

## Setting Up Firebase Auth

First, install the Firebase SDK:

\`\`\`bash
npm install firebase
\`\`\`

Configure Firebase in your application:

\`\`\`javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
\`\`\`

## Implementing Authentication

### Email/Password Authentication

\`\`\`javascript
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Sign up
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
\`\`\`

### Social Authentication

Firebase also supports social authentication with providers like Google, Facebook, and Twitter.

## Security Best Practices

1. **Enable App Check**: Protect your app from abuse
2. **Use Security Rules**: Control access to your data
3. **Implement Rate Limiting**: Prevent brute force attacks
4. **Validate User Input**: Always validate data on both client and server

## Advanced Features

- Custom claims for role-based access
- Multi-factor authentication
- Anonymous authentication
- Phone number authentication

Firebase Authentication makes implementing secure authentication in your React app straightforward and scalable.`,
    author: "Mike Chen",
    excerpt: "Learn how to implement secure authentication in your React applications using Firebase Auth with email/password and social providers.",
    category: "Authentication",
    readTime: "12 min",
    createdAt: new Date("2024-01-10")
  },
  {
    id: "tailwind-css-best-practices",
    title: "Tailwind CSS Best Practices for Modern Web Development",
    content: `Tailwind CSS has revolutionized how we approach styling in web development. This utility-first CSS framework offers incredible flexibility and maintainability. Let's explore the best practices for using Tailwind CSS effectively.

## Why Tailwind CSS?

- **Rapid Development**: Build UIs faster with utility classes
- **Consistent Design**: Enforced design system through utilities
- **Small Bundle Size**: Only includes CSS you actually use
- **Highly Customizable**: Easy to extend and modify

## Best Practices

### 1. Use Component Classes for Reusability

Instead of repeating utility classes, create component classes:

\`\`\`css
/* Instead of repeating */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
}
\`\`\`

### 2. Leverage Responsive Design

Tailwind's responsive prefixes make mobile-first design easy:

\`\`\`html
<div class="text-sm md:text-base lg:text-lg">
  Responsive text sizing
</div>
\`\`\`

### 3. Use Semantic Color Names

Create a consistent color palette:

\`\`\`javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
\`\`\`

### 4. Optimize for Production

Use PurgeCSS to remove unused styles:

\`\`\`javascript
module.exports = {
  purge: {
    content: [
      './src/**/*.html',
      './src/**/*.jsx',
    ],
  }
}
\`\`\`

## Common Patterns

### Card Component
\`\`\`html
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 class="text-xl font-semibold mb-2">Card Title</h3>
  <p class="text-gray-600">Card content goes here</p>
</div>
\`\`\`

### Button Variants
\`\`\`html
<button class="btn-primary">Primary Button</button>
<button class="btn-secondary">Secondary Button</button>
\`\`\`

## Performance Tips

1. **Use JIT Mode**: Enable Just-In-Time compilation for faster builds
2. **Purge Unused Styles**: Remove unused CSS in production
3. **Use CSS Grid**: Leverage Tailwind's grid utilities
4. **Optimize Images**: Use responsive image utilities

Tailwind CSS empowers developers to build beautiful, responsive interfaces quickly while maintaining consistency and performance.`,
    author: "Alex Rodriguez",
    excerpt: "Master Tailwind CSS with these essential best practices for building modern, responsive web applications efficiently.",
    category: "CSS",
    readTime: "6 min",
    createdAt: new Date("2024-01-05")
  },
  {
    id: "typescript-react-patterns",
    title: "Advanced TypeScript Patterns for React Development",
    content: `TypeScript brings type safety and better developer experience to React development. Let's explore advanced patterns that will make your React applications more robust and maintainable.

## Generic Components

Create reusable components with TypeScript generics:

\`\`\`typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
\`\`\`

## Discriminated Unions

Use discriminated unions for better type safety:

\`\`\`typescript
type LoadingState = {
  status: 'loading';
};

type SuccessState = {
  status: 'success';
  data: User[];
};

type ErrorState = {
  status: 'error';
  error: string;
};

type State = LoadingState | SuccessState | ErrorState;

function UserList({ state }: { state: State }) {
  switch (state.status) {
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>{state.data.length} users</div>;
    case 'error':
      return <div>Error: {state.error}</div>;
  }
}
\`\`\`

## Custom Hooks with TypeScript

Create type-safe custom hooks:

\`\`\`typescript
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}
\`\`\`

## Advanced Type Patterns

### Conditional Types
\`\`\`typescript
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

### Mapped Types
\`\`\`typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};
\`\`\`

## Best Practices

1. **Use Strict Mode**: Enable strict TypeScript settings
2. **Define Clear Interfaces**: Create interfaces for all data structures
3. **Leverage Utility Types**: Use built-in utility types like Partial, Required, Pick
4. **Type Your Props**: Always type component props
5. **Use Generic Constraints**: Add constraints to generic types

TypeScript with React provides powerful tools for building maintainable applications. These patterns will help you write more robust and type-safe code.`,
    author: "Emma Wilson",
    excerpt: "Explore advanced TypeScript patterns and techniques for building type-safe React applications with better maintainability.",
    category: "TypeScript",
    readTime: "10 min",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "ai-integration-react",
    title: "Integrating AI APIs in React Applications: A Practical Guide",
    content: `Artificial Intelligence is becoming increasingly accessible to web developers. In this guide, we'll explore how to integrate various AI APIs into your React applications.

## Popular AI APIs for Web Development

### 1. OpenAI API
The most popular choice for text generation and completion:

\`\`\`javascript
const generateText = async (prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.REACT_APP_OPENAI_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  return response.json();
};
\`\`\`

### 2. Hugging Face API
Great for various ML tasks:

\`\`\`javascript
const analyzeSentiment = async (text) => {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
    {
      headers: { Authorization: \`Bearer \${HF_TOKEN}\` },
      method: 'POST',
      body: JSON.stringify(text),
    }
  );
  return response.json();
};
\`\`\`

## Building an AI-Powered Chat Component

\`\`\`typescript
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await generateText(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.choices[0].message.content,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={\`message \${message.isUser ? 'user' : 'ai'}\`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
\`\`\`

## Best Practices for AI Integration

1. **Rate Limiting**: Implement rate limiting to control API costs
2. **Error Handling**: Always handle API errors gracefully
3. **Loading States**: Show loading indicators for better UX
4. **Caching**: Cache responses when appropriate
5. **Security**: Never expose API keys in client-side code

## Cost Optimization

- Use streaming for long responses
- Implement request batching
- Cache common responses
- Use appropriate model sizes

AI integration opens up incredible possibilities for web applications. Start with simple use cases and gradually add more sophisticated features as you become comfortable with the APIs.`,
    author: "David Kim",
    excerpt: "Learn how to integrate AI APIs like OpenAI and Hugging Face into your React applications for intelligent features.",
    category: "AI & ML",
    readTime: "15 min",
    createdAt: new Date("2023-12-28")
  }
];

// Function to add posts to Firestore (for development use)
export const addSamplePostsToFirestore = async (db: any) => {
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    for (const post of samplePosts) {
      await addDoc(collection(db, 'posts'), {
        ...post,
        createdAt: serverTimestamp()
      });
      console.log(`Added post: ${post.title}`);
    }
    console.log('All sample posts added successfully!');
  } catch (error) {
    console.error('Error adding posts:', error);
  }
};
