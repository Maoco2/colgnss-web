'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const RinexAnalysisContent = dynamic(() => import('./RinexAnalysisContent'), { ssr: false });

export default function RinexAnalysisPage() {
  return <RinexAnalysisContent />;
}
