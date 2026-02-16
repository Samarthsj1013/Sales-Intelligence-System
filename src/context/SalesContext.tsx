import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SalesRecord, AIAnalysis } from '@/types/sales';

interface SalesContextType {
  salesData: SalesRecord[];
  setSalesData: (data: SalesRecord[]) => void;
  aiAnalysis: AIAnalysis | null;
  setAiAnalysis: (analysis: AIAnalysis | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <SalesContext.Provider value={{ salesData, setSalesData, aiAnalysis, setAiAnalysis, isAnalyzing, setIsAnalyzing }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within SalesProvider');
  return ctx;
}
