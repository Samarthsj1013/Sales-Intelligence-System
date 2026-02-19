import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Eye, Brain, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { supabase } from '@/integrations/supabase/client';
import { computeDashboardStats, computeProductSummaries, computeCategoryPerformance } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AIAnalysis } from '@/types/sales';

interface Report {
  id: string;
  dataset_name: string;
  report_type: string;
  analysis: AIAnalysis;
  anomalies: string[];
  created_at: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { salesData, activeDataset } = useSales();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('ai_reports').select('*').order('created_at', { ascending: false });
    if (data) setReports(data as unknown as Report[]);
  }, [user]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const generateReport = async () => {
    if (!user || salesData.length === 0 || !activeDataset) { toast.error('Load a dataset first'); return; }
    setIsGenerating(true);
    try {
      const stats = computeDashboardStats(salesData);
      const products = computeProductSummaries(salesData);
      const categories = computeCategoryPerformance(salesData);

      const dataSummary = `
Overall: ${stats.totalSales} units, ₹${stats.totalRevenue} revenue, ${stats.totalProducts} products.
Top: ${stats.topProduct}, Lowest: ${stats.lowestProduct}.
Products: ${products.map(p => `${p.productName}(${p.category}):₹${p.totalRevenue},${p.totalQuantity}u,${p.trend}`).join('; ')}
Categories: ${categories.map(c => `${c.category}:₹${c.totalRevenue},${c.totalQuantity}u`).join('; ')}
Date range: ${salesData[0]?.dateOfSale} to ${salesData[salesData.length - 1]?.dateOfSale}`.trim();

      const { data, error } = await supabase.functions.invoke('analyze-sales', {
        body: { salesData: dataSummary, analysisType: 'full' },
      });
      if (error) throw error;

      // Detect anomalies from data
      const anomalies = detectAnomalies();

      const { error: saveErr } = await supabase.from('ai_reports').insert({
        user_id: user.id,
        dataset_name: activeDataset,
        report_type: 'manual',
        analysis: data,
        anomalies,
      });
      if (saveErr) throw saveErr;

      toast.success('Report generated and saved');
      loadReports();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectAnomalies = (): string[] => {
    const alerts: string[] = [];
    const dailyRevenue: Record<string, number> = {};
    salesData.forEach(r => {
      const d = r.dateOfSale.slice(0, 10);
      dailyRevenue[d] = (dailyRevenue[d] || 0) + r.revenue;
    });
    const values = Object.values(dailyRevenue);
    if (values.length < 3) return alerts;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    const threshold = 2;
    Object.entries(dailyRevenue).forEach(([date, rev]) => {
      if (Math.abs(rev - mean) > threshold * stdDev) {
        const dir = rev > mean ? 'spike' : 'drop';
        alerts.push(`Unusual ${dir} on ${date}: ₹${rev.toLocaleString('en-IN')} (avg: ₹${mean.toFixed(0)})`);
      }
    });
    // Product-level anomalies
    const productQty: Record<string, number[]> = {};
    salesData.forEach(r => {
      if (!productQty[r.productName]) productQty[r.productName] = [];
      productQty[r.productName].push(r.quantitySold);
    });
    Object.entries(productQty).forEach(([name, qtys]) => {
      if (qtys.length < 3) return;
      const m = qtys.reduce((a, b) => a + b, 0) / qtys.length;
      const sd = Math.sqrt(qtys.reduce((s, v) => s + (v - m) ** 2, 0) / qtys.length);
      qtys.forEach((q, i) => {
        if (Math.abs(q - m) > threshold * sd) {
          alerts.push(`${name}: unusual quantity ${q} (avg: ${m.toFixed(0)})`);
        }
      });
    });
    return alerts.slice(0, 10);
  };

  const deleteReport = async (id: string) => {
    await supabase.from('ai_reports').delete().eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
    if (selectedReport?.id === id) setSelectedReport(null);
    toast.success('Report deleted');
  };

  if (selectedReport) {
    const analysis = selectedReport.analysis;
    const anomalies = selectedReport.anomalies || [];
    const sections = [
      { key: 'trends' as const, title: 'Trends', color: 'text-success' },
      { key: 'patterns' as const, title: 'Patterns', color: 'text-info' },
      { key: 'predictions' as const, title: 'Predictions', color: 'text-accent' },
      { key: 'risks' as const, title: 'Risks', color: 'text-danger' },
      { key: 'insights' as const, title: 'Insights', color: 'text-primary' },
    ];
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedReport.dataset_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedReport.report_type} report · {new Date(selectedReport.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedReport(null)}>← Back</Button>
        </div>

        {anomalies.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 border-warning/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Anomaly Alerts</h3>
            </div>
            <ul className="space-y-1.5">
              {anomalies.map((a, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚡</span> {a}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="glass-card p-5 glow-primary">
          <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sections.map(({ key, title, color }) => {
            const items = analysis[key] as string[];
            if (!items?.length) return null;
            return (
              <div key={key} className="glass-card p-5">
                <h3 className={cn("text-sm font-semibold mb-3", color)}>{title}</h3>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80">• {item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generated AI analysis reports with anomaly detection</p>
        </div>
        <Button onClick={generateReport} disabled={isGenerating || salesData.length === 0}>
          {isGenerating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Brain className="w-4 h-4 mr-1" />}
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reports yet. Load a dataset and generate your first AI report.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{report.dataset_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{report.report_type}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {report.anomalies?.length > 0 && (
                      <span className="text-xs text-warning flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {report.anomalies.length} alerts</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
