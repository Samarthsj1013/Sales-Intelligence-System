import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SalesRecord, AIAnalysis } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface DatasetInfo {
  name: string;
  recordCount: number;
  dateRange: string;
  uploadedAt: string;
}

interface SalesContextType {
  salesData: SalesRecord[];
  setSalesData: (data: SalesRecord[]) => void;
  saveSalesData: (records: SalesRecord[], datasetName: string) => Promise<void>;
  aiAnalysis: AIAnalysis | null;
  setAiAnalysis: (analysis: AIAnalysis | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  isLoading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  activeDataset: string | null;
  datasets: DatasetInfo[];
  loadDataset: (name: string) => Promise<void>;
  clearActiveDataset: () => void;
  deleteDataset: (name: string) => Promise<void>;
  loadDatasets: () => Promise<void>;
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
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);

  // Load dataset list on user login (but NOT data — dashboard stays empty)
  useEffect(() => {
    if (!user) {
      setSalesDataState([]);
      setActiveDataset(null);
      setDatasets([]);
      return;
    }
    loadDatasets();
  }, [user]);

  const loadDatasets = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('dataset_name, date_of_sale, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped: Record<string, { count: number; minDate: string; maxDate: string; uploadedAt: string }> = {};
      (data || []).forEach((r: any) => {
        const name = r.dataset_name || 'Default';
        if (!grouped[name]) {
          grouped[name] = { count: 0, minDate: r.date_of_sale, maxDate: r.date_of_sale, uploadedAt: r.created_at };
        }
        grouped[name].count++;
        if (r.date_of_sale < grouped[name].minDate) grouped[name].minDate = r.date_of_sale;
        if (r.date_of_sale > grouped[name].maxDate) grouped[name].maxDate = r.date_of_sale;
        if (r.created_at < grouped[name].uploadedAt) grouped[name].uploadedAt = r.created_at;
      });

      setDatasets(Object.entries(grouped).map(([name, info]) => ({
        name,
        recordCount: info.count,
        dateRange: `${info.minDate} — ${info.maxDate}`,
        uploadedAt: info.uploadedAt,
      })));
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  }, [user]);

  const loadDataset = useCallback(async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .eq('dataset_name', name)
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
      setActiveDataset(name);
      setAiAnalysis(null);
      setFilters(defaultFilters);
    } catch (err) {
      console.error('Failed to load dataset:', err);
      toast.error('Failed to load dataset');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearActiveDataset = useCallback(() => {
    setSalesDataState([]);
    setActiveDataset(null);
    setAiAnalysis(null);
    setFilters(defaultFilters);
  }, []);

  const deleteDataset = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('sales_data')
        .delete()
        .eq('user_id', user.id)
        .eq('dataset_name', name);
      if (error) throw error;
      if (activeDataset === name) clearActiveDataset();
      await loadDatasets();
      toast.success(`Deleted dataset "${name}"`);
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      toast.error('Failed to delete dataset');
    }
  }, [user, activeDataset, clearActiveDataset, loadDatasets]);

  const saveSalesData = useCallback(async (records: SalesRecord[], datasetName: string) => {
    if (!user) return;

    const rows = records.map(r => ({
      user_id: user.id,
      product_name: r.productName,
      category: r.category,
      date_of_sale: r.dateOfSale,
      quantity_sold: r.quantitySold,
      revenue: r.revenue,
      dataset_name: datasetName,
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from('sales_data').insert(batch);
      if (error) throw error;
    }

    setSalesDataState(records);
    setActiveDataset(datasetName);
    await loadDatasets();
  }, [user, loadDatasets]);

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
      activeDataset,
      datasets,
      loadDataset,
      clearActiveDataset,
      deleteDataset,
      loadDatasets,
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
