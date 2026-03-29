import ConvexClientProvider from '../components/ConvexClientProvider';
import './globals.css';

export const metadata = {
  title: 'Eclipse',
  description: 'A mobile-first Secret Hitler clone built with Next.js and Convex.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/assets/avatars/avatar_1.png',
    apple: '/assets/avatars/avatar_1.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Eclipse',
  },
};

export const viewport = {
  themeColor: '#111111',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
