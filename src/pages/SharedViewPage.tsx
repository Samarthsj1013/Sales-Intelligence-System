import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SalesRecord } from '@/types/sales';
import { computeDashboardStats, computeProductSummaries, computeTimeSeries, computeCategoryPerformance } from '@/lib/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2, ShieldAlert } from 'lucide-react';

const CHART_COLORS = ['hsl(160, 60%, 45%)', 'hsl(210, 80%, 60%)', 'hsl(38, 90%, 55%)', 'hsl(280, 60%, 60%)', 'hsl(0, 72%, 55%)'];
const tooltipStyle = { backgroundColor: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' };

export default function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SalesRecord[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) { setError('Invalid link'); setLoading(false); return; }
      try {
        const { data: result, error: fnErr } = await supabase.functions.invoke('shared-dashboard', {
          body: { token },
        });
        if (fnErr || result?.error) {
          setError(result?.error || 'This link is invalid or has been deactivated.');
          setLoading(false);
          return;
        }
        setDatasetName(result.dataset_name);
        setData((result.records || []).map((r: any) => ({
          id: r.id,
          productName: r.product_name,
          category: r.category,
          dateOfSale: r.date_of_sale,
          quantitySold: r.quantity_sold,
          revenue: Number(r.revenue),
        })));
      } catch {
        setError('Failed to load shared dashboard.');
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const stats = useMemo(() => computeDashboardStats(data), [data]);
  const timeSeries = useMemo(() => computeTimeSeries(data), [data]);
  const products = useMemo(() => computeProductSummaries(data).slice(0, 8), [data]);
  const categories = useMemo(() => computeCategoryPerformance(data), [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <ShieldAlert className="w-12 h-12 text-danger mb-4" />
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{datasetName}</h1>
            <p className="text-xs text-muted-foreground">Shared read-only dashboard · {data.length} records</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}` },
            { label: 'Units Sold', value: stats.totalSales.toLocaleString('en-IN') },
            { label: 'Top Product', value: stats.topProduct },
            { label: 'Products', value: stats.totalProducts },
          ].map(s => (
            <div key={s.label} className="glass-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={v => v.slice(5)} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Product Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={products}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="productName" stroke="hsl(215, 15%, 55%)" fontSize={9} angle={-30} textAnchor="end" height={70} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="totalRevenue" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Categories</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categories} dataKey="totalRevenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {categories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{cat.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
