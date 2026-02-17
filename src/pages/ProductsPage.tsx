import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Package } from 'lucide-react';
import { useSales } from '@/context/SalesContext';
import { computeProductSummaries, computeCategoryPerformance } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProductsPage() {
  const { salesData } = useSales();
  const navigate = useNavigate();
  const products = useMemo(() => computeProductSummaries(salesData), [salesData]);
  const categories = useMemo(() => computeCategoryPerformance(salesData), [salesData]);

  if (salesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Products</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload data to see product performance</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Upload Data
        </button>
      </div>
    );
  }

  const top5 = products.slice(0, 5);
  const bottom5 = products.slice(-5).reverse();

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'growing') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-danger" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const ProductTable = ({ title, data, highlight }: { title: string; data: typeof products; highlight: 'success' | 'danger' }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((p, i) => (
          <div key={p.productName} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                highlight === 'success' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              )}>
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{p.productName}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">₹{p.totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{p.totalQuantity} units</p>
              </div>
              <TrendIcon trend={p.trend} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">{products.length} products analyzed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductTable title="🏆 Top 5 Products" data={top5} highlight="success" />
        <ProductTable title="⚠️ Bottom 5 Products" data={bottom5} highlight="danger" />
      </div>

      {/* All products table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">All Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Product</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Revenue</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Quantity</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Avg/Sale</th>
                <th className="text-center py-2 text-muted-foreground font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.productName} className="border-b border-border/30">
                  <td className="py-2.5 text-foreground font-medium">{p.productName}</td>
                  <td className="py-2.5 text-muted-foreground">{p.category}</td>
                  <td className="py-2.5 text-right text-foreground">₹{p.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{p.totalQuantity.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 text-right text-muted-foreground">₹{Number(p.avgRevenue.toFixed(0)).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 flex justify-center"><TrendIcon trend={p.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
