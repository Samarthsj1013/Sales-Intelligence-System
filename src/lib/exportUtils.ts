import { SalesRecord, AIAnalysis, ProductSummary, CategoryPerformance } from '@/types/sales';
import { computeProductSummaries, computeCategoryPerformance, computeDashboardStats } from '@/lib/analytics';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportProductsCSV(data: SalesRecord[]) {
  const products = computeProductSummaries(data);
  const header = 'Product,Category,Revenue,Quantity,Avg/Sale,Trend';
  const rows = products.map(p =>
    `"${p.productName}","${p.category}",${p.totalRevenue},${p.totalQuantity},${p.avgRevenue.toFixed(2)},${p.trend}`
  );
  downloadCSV([header, ...rows].join('\n'), 'product-performance.csv');
}

export function exportSalesDataCSV(data: SalesRecord[]) {
  const header = 'Product Name,Category,Date,Quantity Sold,Revenue';
  const rows = data.map(r =>
    `"${r.productName}","${r.category}",${r.dateOfSale},${r.quantitySold},${r.revenue}`
  );
  downloadCSV([header, ...rows].join('\n'), 'sales-data.csv');
}

export function exportAIInsightsCSV(analysis: AIAnalysis) {
  const rows: string[] = ['Section,Insight'];
  const sections = ['trends', 'patterns', 'predictions', 'risks', 'insights'] as const;
  sections.forEach(s => {
    (analysis[s] || []).forEach(item => {
      rows.push(`"${s}","${item.replace(/"/g, '""')}"`);
    });
  });
  rows.unshift(`"summary","${analysis.summary.replace(/"/g, '""')}"`);
  downloadCSV(rows.join('\n'), 'ai-insights.csv');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportProductsPDF(data: SalesRecord[]) {
  const products = computeProductSummaries(data);
  const stats = computeDashboardStats(data);
  const categories = computeCategoryPerformance(data);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Product Performance Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  // Stats summary
  doc.setFontSize(12);
  doc.text('Overview', 14, 40);
  doc.setFontSize(10);
  doc.text(`Total Revenue: ₹${stats.totalRevenue.toLocaleString('en-IN')}`, 14, 48);
  doc.text(`Total Units Sold: ${stats.totalSales.toLocaleString('en-IN')}`, 14, 54);
  doc.text(`Products: ${stats.totalProducts} | Top: ${stats.topProduct}`, 14, 60);

  // Products table
  autoTable(doc, {
    startY: 70,
    head: [['Product', 'Category', 'Revenue (₹)', 'Quantity', 'Trend']],
    body: products.map(p => [p.productName, p.category, p.totalRevenue.toLocaleString('en-IN'), p.totalQuantity.toString(), p.trend]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 105] },
  });

  doc.save('product-performance.pdf');
}

export function exportAIInsightsPDF(analysis: AIAnalysis) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('AI Sales Analysis Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  doc.setFontSize(12);
  doc.text('Summary', 14, 40);
  doc.setFontSize(9);
  const summaryLines = doc.splitTextToSize(analysis.summary, 180);
  doc.text(summaryLines, 14, 48);

  let y = 48 + summaryLines.length * 5 + 10;
  const sections = [
    { key: 'trends' as const, title: 'Trends' },
    { key: 'patterns' as const, title: 'Patterns' },
    { key: 'predictions' as const, title: 'Predictions' },
    { key: 'risks' as const, title: 'Risks' },
    { key: 'insights' as const, title: 'Insights' },
  ];

  sections.forEach(({ key, title }) => {
    const items = analysis[key];
    if (!items?.length) return;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(title, 14, y);
    y += 7;
    doc.setFontSize(9);
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 180);
      if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });
    y += 5;
  });

  doc.save('ai-analysis.pdf');
}
