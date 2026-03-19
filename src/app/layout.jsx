import ConvexClientProvider from '../components/ConvexClientProvider';
import './globals.css';

export const metadata = {
  title: 'Eclipse - Secret Hitler',
  description: 'Digital War Room Table',
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
