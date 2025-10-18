import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Social Content Engine',
  description: 'Automated social media content generation and scheduling platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
