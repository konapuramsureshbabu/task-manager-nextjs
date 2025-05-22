// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './layout/ClientLayout';
import { Providers } from './redux/providers';


export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Manage your tasks efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-100">
      <Providers>
      <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}