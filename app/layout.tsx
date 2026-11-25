import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Brewery', template: '%s | Brewery' },
  description: 'Find Magic: The Gathering cards and build decks.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
