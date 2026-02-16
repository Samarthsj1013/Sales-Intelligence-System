export interface SalesRecord {
  id: string;
  productName: string;
  category: string;
  dateOfSale: string;
  quantitySold: number;
  revenue: number;
}

export interface ProductSummary {
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  avgRevenue: number;
  salesCount: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  topProduct: string;
  lowestProduct: string;
  avgOrderValue: number;
  totalProducts: number;
}

export interface TimeSeriesPoint {
  date: string;
  quantity: number;
  revenue: number;
}

export interface CategoryPerformance {
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  productCount: number;
}

export interface AIAnalysis {
  trends: string[];
  patterns: string[];
  predictions: string[];
  risks: string[];
  insights: string[];
  summary: string;
}
