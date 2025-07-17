import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memic - Create Viral Memes in Seconds",
  description: "Create professional memes with 1000+ templates, AI-powered editor, and advanced text tools. Completely free meme generator with instant download.",
  icons: {
    icon: '/memix.ico',
    shortcut: '/memix.ico',
    apple: '/memix.ico',
  },
  keywords: ['meme generator', 'memes', 'templates', 'viral content', 'image editor', 'free'],
  authors: [{ name: 'Memic' }],
  openGraph: {
    title: 'Memic - Create Viral Memes in Seconds',
    description: 'Create professional memes with 1000+ templates, AI-powered editor, and advanced text tools.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memic - Create Viral Memes in Seconds',
    description: 'Create professional memes with 1000+ templates, AI-powered editor, and advanced text tools.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
