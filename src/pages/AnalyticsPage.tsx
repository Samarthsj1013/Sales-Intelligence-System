import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSales } from '@/context/SalesContext';
import { SalesTrendChart, ProductComparisonChart, CategoryPieChart } from '@/components/Charts';
import { computeTimeSeries, computeCategoryPerformance } from '@/lib/analytics';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { salesData } = useSales();
  const navigate = useNavigate();
  const timeSeries = useMemo(() => computeTimeSeries(salesData), [salesData]);
  const categories = useMemo(() => computeCategoryPerformance(salesData), [salesData]);

  if (salesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Data Yet</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload sales data to see visual analytics</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Upload Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visual Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Charts and visualizations for your sales data</p>
      </div>

      <SalesTrendChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductComparisonChart />
        <CategoryPieChart />
      </div>

      {/* Category breakdown table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Revenue</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Quantity</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Products</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.category} className="border-b border-border/50">
                  <td className="py-2.5 text-foreground font-medium">{cat.category}</td>
                  <td className="py-2.5 text-right text-foreground">₹{cat.totalRevenue.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{cat.totalQuantity.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{cat.productCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
