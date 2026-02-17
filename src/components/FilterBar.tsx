import { useMemo } from 'react';
import { useSales, useFilteredSales } from '@/context/SalesContext';
import { X } from 'lucide-react';

export default function FilterBar() {
  const { salesData, filters, setFilters } = useSales();

  const categories = useMemo(() => [...new Set(salesData.map(r => r.category))].sort(), [salesData]);
  const products = useMemo(() => [...new Set(salesData.map(r => r.productName))].sort(), [salesData]);
  const hasFilters = filters.dateFrom || filters.dateTo || filters.category || filters.product;

  const clearFilters = () => setFilters({ dateFrom: '', dateTo: '', category: '', product: '' });

  if (salesData.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
        className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="From"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
        className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="To"
      />
      <select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select
        value={filters.product}
        onChange={(e) => setFilters({ ...filters, product: e.target.value })}
        className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">All Products</option>
        {products.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-danger hover:opacity-80">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}
