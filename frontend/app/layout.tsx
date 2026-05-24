import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AetherOS Command Center',
  description: 'Sovereign Local-First AI Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0F1115] text-gray-200">
        {children}
      </body>
    </html>
  );
}
