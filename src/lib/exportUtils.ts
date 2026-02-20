import { SalesRecord, AIAnalysis } from '@/types/sales';
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
  rows.push(`"summary","${analysis.summary.replace(/"/g, '""')}"`);
  const sections = ['trends', 'patterns', 'predictions', 'risks', 'insights'] as const;
  sections.forEach(s => {
    (analysis[s] || []).forEach(item => {
      rows.push(`"${s}","${item.replace(/"/g, '""')}"`);
    });
  });
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
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Product Performance Report', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 27);
  doc.setTextColor(0);

  doc.setDrawColor(200);
  doc.line(14, 30, 196, 30);

  // Overview
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', `₹${stats.totalRevenue.toLocaleString('en-IN')}`],
      ['Total Units Sold', stats.totalSales.toLocaleString('en-IN')],
      ['Total Products', String(stats.totalProducts)],
      ['Top Product', stats.topProduct],
      ['Lowest Product', stats.lowestProduct],
      ['Avg Order Value', `₹${stats.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 105], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  });

  // Products table
  const tableY = (doc as any).lastAutoTable?.finalY || 90;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Product Breakdown', 14, tableY + 10);

  autoTable(doc, {
    startY: tableY + 14,
    head: [['Product', 'Category', 'Revenue (₹)', 'Qty', 'Avg (₹)', 'Trend']],
    body: products.map(p => [
      p.productName,
      p.category,
      p.totalRevenue.toLocaleString('en-IN'),
      p.totalQuantity.toLocaleString('en-IN'),
      p.avgRevenue.toFixed(0),
      p.trend.charAt(0).toUpperCase() + p.trend.slice(1),
    ]),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [41, 128, 105], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw).toLowerCase();
        if (val === 'growing') data.cell.styles.textColor = [22, 163, 74];
        else if (val === 'declining') data.cell.styles.textColor = [220, 38, 38];
        else data.cell.styles.textColor = [120, 120, 120];
      }
    },
  });

  // Category breakdown
  const catY = (doc as any).lastAutoTable?.finalY || 150;
  const categories = computeCategoryPerformance(data);

  if (catY + 40 < 270) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', 14, catY + 10);

    autoTable(doc, {
      startY: catY + 14,
      head: [['Category', 'Revenue (₹)', 'Quantity', 'Products']],
      body: categories.map(c => [
        c.category,
        c.totalRevenue.toLocaleString('en-IN'),
        c.totalQuantity.toLocaleString('en-IN'),
        String(c.productCount),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [41, 128, 105], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Sales Intelligence System — Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save('product-performance.pdf');
}

export function exportAIInsightsPDF(analysis: AIAnalysis) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Sales Analysis Report', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 27);
  doc.setTextColor(0);

  doc.setDrawColor(200);
  doc.line(14, 30, 196, 30);

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, 38);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(analysis.summary, 178);
  doc.text(summaryLines, 14, 45);

  let y = 45 + summaryLines.length * 4.5 + 8;

  const sections = [
    { key: 'trends' as const, title: 'Trend Analysis' },
    { key: 'patterns' as const, title: 'Pattern Detection' },
    { key: 'predictions' as const, title: 'Demand Predictions' },
    { key: 'risks' as const, title: 'Risk Identification' },
    { key: 'insights' as const, title: 'Business Insights' },
  ];

  sections.forEach(({ key, title }) => {
    const items = analysis[key];
    if (!items?.length) return;
    if (y > 255) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 2;
    doc.setDrawColor(41, 128, 105);
    doc.setLineWidth(0.5);
    doc.line(14, y, 70, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 178);
      if (y + lines.length * 4.5 > 275) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 2;
    });
    doc.setTextColor(0);
    y += 5;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Sales Intelligence System AI Report — Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save('ai-analysis.pdf');
}
