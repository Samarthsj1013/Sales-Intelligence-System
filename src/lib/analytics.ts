import { SalesRecord, DashboardStats, ProductSummary, TimeSeriesPoint, CategoryPerformance } from '@/types/sales';

export function computeDashboardStats(data: SalesRecord[]): DashboardStats {
  if (data.length === 0) {
    return { totalSales: 0, totalRevenue: 0, topProduct: '-', lowestProduct: '-', avgOrderValue: 0, totalProducts: 0 };
  }

  const totalSales = data.reduce((sum, r) => sum + r.quantitySold, 0);
  const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0);

  const productRevenue: Record<string, number> = {};
  data.forEach(r => {
    productRevenue[r.productName] = (productRevenue[r.productName] || 0) + r.revenue;
  });

  const sorted = Object.entries(productRevenue).sort((a, b) => b[1] - a[1]);
  const topProduct = sorted[0]?.[0] || '-';
  const lowestProduct = sorted[sorted.length - 1]?.[0] || '-';

  return {
    totalSales,
    totalRevenue,
    topProduct,
    lowestProduct,
    avgOrderValue: totalRevenue / data.length,
    totalProducts: Object.keys(productRevenue).length,
  };
}

export function computeProductSummaries(data: SalesRecord[]): ProductSummary[] {
  const map: Record<string, { records: SalesRecord[]; category: string }> = {};
  data.forEach(r => {
    if (!map[r.productName]) map[r.productName] = { records: [], category: r.category };
    map[r.productName].records.push(r);
  });

  return Object.entries(map).map(([name, { records, category }]) => {
    const totalQuantity = records.reduce((s, r) => s + r.quantitySold, 0);
    const totalRevenue = records.reduce((s, r) => s + r.revenue, 0);
    const sorted = records.sort((a, b) => a.dateOfSale.localeCompare(b.dateOfSale));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, r) => s + r.revenue, 0);
    const secondHalf = sorted.slice(half).reduce((s, r) => s + r.revenue, 0);
    const trend: 'growing' | 'declining' | 'stable' = secondHalf > firstHalf * 1.1 ? 'growing' : secondHalf < firstHalf * 0.9 ? 'declining' : 'stable';

    return {
      productName: name,
      category,
      totalQuantity,
      totalRevenue,
      avgRevenue: totalRevenue / records.length,
      salesCount: records.length,
      trend,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function computeTimeSeries(data: SalesRecord[]): TimeSeriesPoint[] {
  const map: Record<string, { quantity: number; revenue: number }> = {};
  data.forEach(r => {
    const date = r.dateOfSale.slice(0, 10);
    if (!map[date]) map[date] = { quantity: 0, revenue: 0 };
    map[date].quantity += r.quantitySold;
    map[date].revenue += r.revenue;
  });

  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({ date, ...vals }));
}

export function computeCategoryPerformance(data: SalesRecord[]): CategoryPerformance[] {
  const map: Record<string, { revenue: number; quantity: number; products: Set<string> }> = {};
  data.forEach(r => {
    if (!map[r.category]) map[r.category] = { revenue: 0, quantity: 0, products: new Set() };
    map[r.category].revenue += r.revenue;
    map[r.category].quantity += r.quantitySold;
    map[r.category].products.add(r.productName);
  });

  return Object.entries(map)
    .map(([category, v]) => ({
      category,
      totalRevenue: v.revenue,
      totalQuantity: v.quantity,
      productCount: v.products.size,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}
