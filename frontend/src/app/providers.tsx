'use client';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeContextProvider } from '@/contexts/ThemeContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeContextProvider>
  );
}
