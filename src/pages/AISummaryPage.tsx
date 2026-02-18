import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Search, Target, AlertTriangle, Lightbulb, Loader2, Download } from 'lucide-react';
import { useSales } from '@/context/SalesContext';
import { computeProductSummaries, computeCategoryPerformance, computeDashboardStats } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportAIInsightsCSV, exportAIInsightsPDF } from '@/lib/exportUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function AISummaryPage() {
  const { salesData, aiAnalysis, setAiAnalysis, isAnalyzing, setIsAnalyzing } = useSales();
  const navigate = useNavigate();

  const runAnalysis = async () => {
    if (salesData.length === 0) {
      toast.error('No data to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const stats = computeDashboardStats(salesData);
      const products = computeProductSummaries(salesData);
      const categories = computeCategoryPerformance(salesData);

      const dataSummary = `
Overall: ${stats.totalSales} units sold, ₹${stats.totalRevenue} total revenue, ${stats.totalProducts} products.
Top product: ${stats.topProduct}, Lowest: ${stats.lowestProduct}.

Products (name, category, revenue, qty, trend):
${products.map(p => `- ${p.productName} (${p.category}): ₹${p.totalRevenue}, ${p.totalQuantity} units, ${p.trend}`).join('\n')}

Categories (name, revenue, qty):
${categories.map(c => `- ${c.category}: ₹${c.totalRevenue}, ${c.totalQuantity} units, ${c.productCount} products`).join('\n')}

Date range: ${salesData[0]?.dateOfSale} to ${salesData[salesData.length - 1]?.dateOfSale}
      `.trim();

      const { data, error } = await supabase.functions.invoke('analyze-sales', {
        body: { salesData: dataSummary, analysisType: 'full' },
      });

      if (error) throw error;
      setAiAnalysis(data);
      toast.success('AI analysis complete');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (salesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Brain className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Data to Analyze</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload sales data first</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Upload Data
        </button>
      </div>
    );
  }

  const sections = [
    { key: 'trends', icon: TrendingUp, title: 'Trend Analysis', color: 'text-success', bg: 'bg-success/10' },
    { key: 'patterns', icon: Search, title: 'Pattern Detection', color: 'text-info', bg: 'bg-info/10' },
    { key: 'predictions', icon: Target, title: 'Demand Predictions', color: 'text-accent', bg: 'bg-accent/10' },
    { key: 'risks', icon: AlertTriangle, title: 'Risk Identification', color: 'text-danger', bg: 'bg-danger/10' },
    { key: 'insights', icon: Lightbulb, title: 'Business Insights', color: 'text-primary', bg: 'bg-primary/10' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered analysis of your sales data</p>
        </div>
        <div className="flex items-center gap-2">
          {aiAnalysis && !isAnalyzing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportAIInsightsCSV(aiAnalysis)}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAIInsightsPDF(aiAnalysis)}>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing your sales data with AI...</p>
        </motion.div>
      )}

      {aiAnalysis && !isAnalyzing && (
        <>
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 glow-primary">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Overall Summary</h3>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{aiAnalysis.summary}</p>
          </motion.div>

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.map(({ key, icon: Icon, title, color, bg }, idx) => {
              const items = aiAnalysis[key] as string[];
              if (!items || items.length === 0) return null;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", bg.replace('/10', ''))} />
                        <p className="text-sm text-foreground/80">{item}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
