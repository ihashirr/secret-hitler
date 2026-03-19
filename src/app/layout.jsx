import ConvexClientProvider from '../components/ConvexClientProvider';
import './globals.css';

export const metadata = {
  title: 'Eclipse - Secret Hitler',
  description: 'Digital War Room Table',
  manifest: '/manifest.json',
  themeColor: '#020617',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  appleWebApp: {
    capable: true,
    title: 'Eclipse',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans uppercase">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
