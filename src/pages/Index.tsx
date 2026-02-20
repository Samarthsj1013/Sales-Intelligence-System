import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Package, BarChart3, Download } from 'lucide-react';
import { useSales, useFilteredSales } from '@/context/SalesContext';
import { computeDashboardStats } from '@/lib/analytics';
import StatCard from '@/components/StatCard';
import { SalesTrendChart, ProductComparisonChart, CategoryPieChart } from '@/components/Charts';
import FilterBar from '@/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { exportSalesDataCSV, exportProductsPDF } from '@/lib/exportUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { salesData, isLoading, activeDataset, datasets } = useSales();
  const filteredData = useFilteredSales();
  const stats = useMemo(() => computeDashboardStats(filteredData), [filteredData]);
  const navigate = useNavigate();
  const hasData = salesData.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading your data...</p>
      </div>
    );
  }

  // No active dataset — show welcome screen
  if (!activeDataset || !hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto glow-primary">
            <TrendingUp className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Sales Intelligence System</h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              Upload your sales data to unlock AI-powered trend analysis, demand predictions, and actionable business insights.
            </p>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Upload New Data
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-primary">{activeDataset}</span> · {filteredData.length.toLocaleString('en-IN')} of {salesData.length.toLocaleString('en-IN')} records
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportSalesDataCSV(filteredData)}>Sales Data (CSV)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportProductsPDF(filteredData)}>Product Report (PDF)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Sales" value={stats.totalSales.toLocaleString('en-IN')} icon={ShoppingCart} trend="up" subtitle="units sold" />
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={DollarSign} trend="up" subtitle="lifetime" />
        <StatCard title="Products" value={stats.totalProducts} icon={Package} trend="neutral" subtitle="unique products" />
        <StatCard title="Top Product" value={stats.topProduct} icon={TrendingUp} trend="up" subtitle="highest revenue" />
        <StatCard title="Lowest Product" value={stats.lowestProduct} icon={TrendingDown} trend="down" subtitle="needs attention" />
        <StatCard title="Avg Order" value={`₹${stats.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} icon={BarChart3} trend="neutral" subtitle="per transaction" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart />
        <ProductComparisonChart />
      </div>

      <CategoryPieChart />
    </div>
  );
}
