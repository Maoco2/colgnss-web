'use client';
import dynamic from 'next/dynamic';

const ActiveNetworkContent = dynamic(() => import('./ActiveNetworkContent'), { ssr: false });

export default function ActiveNetworkPage() {
  return <ActiveNetworkContent />;
}
