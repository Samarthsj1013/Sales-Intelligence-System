import { motion } from 'framer-motion';
import { History, Trash2, Eye, Database, Calendar, FileSpreadsheet } from 'lucide-react';
import { useSales } from '@/context/SalesContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const { datasets, activeDataset, loadDataset, deleteDataset, isLoading } = useSales();
  const navigate = useNavigate();

  const handleLoad = async (name: string) => {
    await loadDataset(name);
    navigate('/');
  };

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <History className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Datasets Yet</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload a CSV file to create your first dataset</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Upload Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dataset History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} saved. Select one to view in the dashboard.
        </p>
      </div>

      <div className="space-y-3">
        {datasets.map((ds, i) => (
          <motion.div
            key={ds.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "glass-card p-5 flex items-center justify-between transition-all duration-200",
              activeDataset === ds.name && "border-primary/50 glow-primary"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                activeDataset === ds.name ? "bg-primary/20" : "bg-muted"
              )}>
                <FileSpreadsheet className={cn("w-5 h-5", activeDataset === ds.name ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{ds.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Database className="w-3 h-3" /> {ds.recordCount.toLocaleString()} records
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {ds.dateRange}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeDataset === ds.name ? (
                <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Active</span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoad(ds.name)}
                  disabled={isLoading}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteDataset(ds.name)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
