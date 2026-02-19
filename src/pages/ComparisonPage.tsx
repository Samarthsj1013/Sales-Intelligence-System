import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompareArrows, ArrowLeftRight, CalendarRange } from 'lucide-react';
import { useSales } from '@/context/SalesContext';
import { SalesRecord } from '@/types/sales';
import { computeDashboardStats, computeProductSummaries, computeCategoryPerformance, computeTimeSeries } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { toast } from 'sonner';

const tooltipStyle = { backgroundColor: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' };

export default function ComparisonPage() {
  const { salesData, datasets, activeDataset } = useSales();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'dataset' | 'daterange'>('dataset');
  const [datasetA, setDatasetA] = useState<string>('');
  const [datasetB, setDatasetB] = useState<string>('');
  const [dateFromA, setDateFromA] = useState('');
  const [dateToA, setDateToA] = useState('');
  const [dateFromB, setDateFromB] = useState('');
  const [dateToB, setDateToB] = useState('');
  const [loadedA, setLoadedA] = useState<SalesRecord[]>([]);
  const [loadedB, setLoadedB] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDatasetRecords = async (name: string): Promise<SalesRecord[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .eq('dataset_name', name)
      .order('date_of_sale', { ascending: true });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      productName: r.product_name,
      category: r.category,
      dateOfSale: r.date_of_sale,
      quantitySold: r.quantity_sold,
      revenue: Number(r.revenue),
    }));
  };

  const handleCompareDatasets = async () => {
    if (!datasetA || !datasetB) { toast.error('Select two datasets'); return; }
    setIsLoading(true);
    try {
      const [a, b] = await Promise.all([loadDatasetRecords(datasetA), loadDatasetRecords(datasetB)]);
      setLoadedA(a);
      setLoadedB(b);
    } catch { toast.error('Failed to load datasets'); }
    finally { setIsLoading(false); }
  };

  const handleCompareDateRange = () => {
    if (!dateFromA || !dateToA || !dateFromB || !dateToB) { toast.error('Fill all date fields'); return; }
    setLoadedA(salesData.filter(r => r.dateOfSale >= dateFromA && r.dateOfSale <= dateToA));
    setLoadedB(salesData.filter(r => r.dateOfSale >= dateFromB && r.dateOfSale <= dateToB));
  };

  const statsA = useMemo(() => computeDashboardStats(loadedA), [loadedA]);
  const statsB = useMemo(() => computeDashboardStats(loadedB), [loadedB]);
  const productsA = useMemo(() => computeProductSummaries(loadedA).slice(0, 8), [loadedA]);
  const productsB = useMemo(() => computeProductSummaries(loadedB).slice(0, 8), [loadedB]);
  const timeA = useMemo(() => computeTimeSeries(loadedA), [loadedA]);
  const timeB = useMemo(() => computeTimeSeries(loadedB), [loadedB]);

  const labelA = mode === 'dataset' ? datasetA : `${dateFromA} → ${dateToA}`;
  const labelB = mode === 'dataset' ? datasetB : `${dateFromB} → ${dateToB}`;
  const hasResults = loadedA.length > 0 && loadedB.length > 0;

  if (datasets.length === 0 && salesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <GitCompareArrows className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Data to Compare</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload at least two datasets to compare</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Upload Data</button>
      </div>
    );
  }

  const StatCompare = ({ label, a, b }: { label: string; a: string | number; b: string | number }) => (
    <div className="glass-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1 truncate">{labelA || 'A'}</p>
          <p className="text-lg font-bold text-foreground">{a}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1 truncate">{labelB || 'B'}</p>
          <p className="text-lg font-bold text-foreground">{b}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comparison Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Compare datasets or date ranges side by side</p>
      </div>

      <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setLoadedA([]); setLoadedB([]); }}>
        <TabsList>
          <TabsTrigger value="dataset" className="flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> Dataset vs Dataset</TabsTrigger>
          <TabsTrigger value="daterange" className="flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Date Range</TabsTrigger>
        </TabsList>

        <TabsContent value="dataset" className="mt-4">
          <div className="glass-card p-5 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dataset A</label>
              <Select value={datasetA} onValueChange={setDatasetA}>
                <SelectTrigger><SelectValue placeholder="Select dataset" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dataset B</label>
              <Select value={datasetB} onValueChange={setDatasetB}>
                <SelectTrigger><SelectValue placeholder="Select dataset" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleCompareDatasets} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Compare'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="daterange" className="mt-4">
          {salesData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Load a dataset first to compare date ranges within it.</p>
          ) : (
            <div className="glass-card p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Comparing within: <span className="font-medium text-foreground">{activeDataset || 'current data'}</span></p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Period A: From</label>
                  <input type="date" value={dateFromA} onChange={e => setDateFromA(e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                  <input type="date" value={dateToA} onChange={e => setDateToA(e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Period B: From</label>
                  <input type="date" value={dateFromB} onChange={e => setDateFromB(e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                  <input type="date" value={dateToB} onChange={e => setDateToB(e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                </div>
                <Button onClick={handleCompareDateRange}>Compare</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {hasResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* KPI comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCompare label="Total Revenue" a={`₹${statsA.totalRevenue.toLocaleString('en-IN')}`} b={`₹${statsB.totalRevenue.toLocaleString('en-IN')}`} />
            <StatCompare label="Units Sold" a={statsA.totalSales.toLocaleString('en-IN')} b={statsB.totalSales.toLocaleString('en-IN')} />
            <StatCompare label="Products" a={statsA.totalProducts} b={statsB.totalProducts} />
            <StatCompare label="Top Product" a={statsA.topProduct} b={statsB.topProduct} />
            <StatCompare label="Avg Order Value" a={`₹${statsA.avgOrderValue.toFixed(0)}`} b={`₹${statsB.avgOrderValue.toFixed(0)}`} />
            <StatCompare label="Records" a={loadedA.length} b={loadedB.length} />
          </div>

          {/* Revenue trend overlay */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend Overlay</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={11} allowDuplicatedCategory={false} tickFormatter={v => v?.slice(5)} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line data={timeA} type="monotone" dataKey="revenue" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} name={labelA || 'A'} />
                <Line data={timeB} type="monotone" dataKey="revenue" stroke="hsl(210, 80%, 60%)" strokeWidth={2} dot={false} name={labelB || 'B'} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Product comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Products — {labelA || 'A'}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productsA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="productName" stroke="hsl(215, 15%, 55%)" fontSize={9} angle={-30} textAnchor="end" height={70} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="totalRevenue" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Products — {labelB || 'B'}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productsB}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="productName" stroke="hsl(215, 15%, 55%)" fontSize={9} angle={-30} textAnchor="end" height={70} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="totalRevenue" fill="hsl(210, 80%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
