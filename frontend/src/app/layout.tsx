import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'ColGNSS - Planificación de Levantamientos GNSS',
  description: 'Plataforma profesional para ingenieros, topógrafos y geodestas en la planificación de levantamientos GNSS en Colombia. Consulta redes activas y pasivas del IGAC, calcula tiempos de rastreo y genera informes técnicos.',
  keywords: ['GNSS', 'IGAC', 'Colombia', 'topografía', 'geodesia', 'Red Activa', 'Red Pasiva', 'tiempo de rastreo', 'Resolución 643'],
  applicationName: 'ColGNSS',
  authors: [{ name: 'ColGNSS Team' }],
  category: 'Geomatic Engineering',
  openGraph: {
    title: 'ColGNSS - Planificación de Levantamientos GNSS',
    description: 'Plataforma profesional para planificación de levantamientos GNSS en Colombia',
    type: 'website',
    locale: 'es_CO',
    siteName: 'ColGNSS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ColGNSS',
    description: 'Plataforma profesional para planificación de levantamientos GNSS en Colombia',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a5276',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
