import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SalesRecord, AIAnalysis } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface SalesContextType {
  salesData: SalesRecord[];
  setSalesData: (data: SalesRecord[]) => void;
  saveSalesData: (records: SalesRecord[]) => Promise<void>;
  aiAnalysis: AIAnalysis | null;
  setAiAnalysis: (analysis: AIAnalysis | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  isLoading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  category: string;
  product: string;
}

const defaultFilters: FilterState = { dateFrom: '', dateTo: '', category: '', product: '' };

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [salesData, setSalesDataState] = useState<SalesRecord[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Load data from database on user login
  useEffect(() => {
    if (!user) {
      setSalesDataState([]);
      return;
    }
    loadSalesData();
  }, [user]);

  const loadSalesData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date_of_sale', { ascending: true });

      if (error) throw error;

      const records: SalesRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        productName: r.product_name,
        category: r.category,
        dateOfSale: r.date_of_sale,
        quantitySold: r.quantity_sold,
        revenue: Number(r.revenue),
      }));

      setSalesDataState(records);
    } catch (err: any) {
      console.error('Failed to load sales data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSalesData = useCallback(async (records: SalesRecord[]) => {
    if (!user) return;

    // Delete existing data and insert new
    const { error: deleteError } = await supabase
      .from('sales_data')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Insert in batches of 500
    const rows = records.map(r => ({
      user_id: user.id,
      product_name: r.productName,
      category: r.category,
      date_of_sale: r.dateOfSale,
      quantity_sold: r.quantitySold,
      revenue: r.revenue,
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from('sales_data').insert(batch);
      if (error) throw error;
    }

    setSalesDataState(records);
  }, [user]);

  const setSalesData = useCallback((data: SalesRecord[]) => {
    setSalesDataState(data);
  }, []);

  return (
    <SalesContext.Provider value={{
      salesData,
      setSalesData,
      saveSalesData,
      aiAnalysis,
      setAiAnalysis,
      isAnalyzing,
      setIsAnalyzing,
      isLoading,
      filters,
      setFilters,
    }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within SalesProvider');
  return ctx;
}

export function useFilteredSales() {
  const { salesData, filters } = useSales();
  return React.useMemo(() => {
    return salesData.filter(r => {
      if (filters.dateFrom && r.dateOfSale < filters.dateFrom) return false;
      if (filters.dateTo && r.dateOfSale > filters.dateTo) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.product && r.productName !== filters.product) return false;
      return true;
    });
  }, [salesData, filters]);
}
