import ConvexClientProvider from '../components/ConvexClientProvider';
import './globals.css';

export const metadata = {
  title: 'Eclipse',
  description: 'A mobile-first Secret Hitler clone built with Next.js and Convex.',
  manifest: '/manifest.webmanifest',
  themeColor: '#111111',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Eclipse',
  },
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
