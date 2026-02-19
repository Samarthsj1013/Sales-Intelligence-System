import { useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useFilteredSales } from '@/context/SalesContext';
import { computeTimeSeries, computeCategoryPerformance, computeProductSummaries } from '@/lib/analytics';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { downloadChartAsImage } from '@/lib/chartDownload';

const CHART_COLORS = [
  'hsl(160, 60%, 45%)',
  'hsl(210, 80%, 60%)',
  'hsl(38, 90%, 55%)',
  'hsl(280, 60%, 60%)',
  'hsl(0, 72%, 55%)',
  'hsl(190, 70%, 50%)',
];

const tooltipStyle = { backgroundColor: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' };

function ChartHeader({ title, onDownload }: { title: string; onDownload: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <button onClick={onDownload} className="text-muted-foreground hover:text-foreground transition-colors" title="Download chart as image">
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

export function SalesTrendChart() {
  const filteredData = useFilteredSales();
  const timeSeries = useMemo(() => computeTimeSeries(filteredData), [filteredData]);
  const ref = useRef<HTMLDivElement>(null);

  if (timeSeries.length === 0) return null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <ChartHeader title="Sales Trend Over Time" onDownload={() => downloadChartAsImage(ref.current, 'sales-trend')} />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timeSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => v.slice(5)} />
          <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="revenue" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="quantity" stroke="hsl(210, 80%, 60%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function ProductComparisonChart() {
  const filteredData = useFilteredSales();
  const products = useMemo(() => computeProductSummaries(filteredData).slice(0, 8), [filteredData]);
  const ref = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
      <ChartHeader title="Product Revenue Comparison" onDownload={() => downloadChartAsImage(ref.current, 'product-comparison')} />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={products}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis dataKey="productName" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={-30} textAnchor="end" height={80} />
          <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="totalRevenue" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function CategoryPieChart() {
  const filteredData = useFilteredSales();
  const categories = useMemo(() => computeCategoryPerformance(filteredData), [filteredData]);
  const ref = useRef<HTMLDivElement>(null);

  if (categories.length === 0) return null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
      <ChartHeader title="Category Performance" onDownload={() => downloadChartAsImage(ref.current, 'category-performance')} />
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={categories} dataKey="totalRevenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
            {categories.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {categories.map((cat, i) => (
          <div key={cat.category} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-muted-foreground">{cat.category}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
