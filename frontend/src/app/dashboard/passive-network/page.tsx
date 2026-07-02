'use client';
import dynamic from 'next/dynamic';

const PassiveNetworkContent = dynamic(() => import('./PassiveNetworkContent'), { ssr: false });

export default function PassiveNetworkPage() {
  return <PassiveNetworkContent />;
}
