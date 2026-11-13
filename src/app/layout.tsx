import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCOA Social Publisher - Medical Coding Officers Academy',
  description: 'Multi-platform social publisher for Facebook, Instagram, and Google Business Profile.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
