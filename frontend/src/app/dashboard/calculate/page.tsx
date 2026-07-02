'use client';
import dynamic from 'next/dynamic';

const CalculateContent = dynamic(() => import('./CalculateContent'), { ssr: false });

export default function CalculatePage() {
  return <CalculateContent />;
}
