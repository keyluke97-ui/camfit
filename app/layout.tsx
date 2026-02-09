import type { Metadata } from 'next';
import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
    title: 'Camfit Growth Editor',
    description: 'AI-Powered Camping Site Analysis',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body className="antialiased min-h-screen">
                {children}
                <Analytics />
            </body>
        </html>
    );
}
