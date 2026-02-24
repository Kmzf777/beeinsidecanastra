'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Period } from '@/types';

interface PeriodContextType {
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
}

const now = new Date();
const defaultPeriod: Period = {
  month: now.getMonth() + 1,
  year: now.getFullYear(),
};

const PeriodContext = createContext<PeriodContextType | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(defaultPeriod);

  return (
    <PeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextType {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
