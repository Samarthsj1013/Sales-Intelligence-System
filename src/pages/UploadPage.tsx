import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useSales } from '@/context/SalesContext';
import { parseCSV } from '@/lib/csvParser';
import { generateSampleData } from '@/lib/sampleData';
import { SalesRecord } from '@/types/sales';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function UploadPage() {
  const { salesData, saveSalesData, activeDataset } = useSales();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [manualRows, setManualRows] = useState<Partial<SalesRecord>[]>([
    { productName: '', category: '', dateOfSale: '', quantitySold: 0, revenue: 0 },
  ]);

  const getDatasetName = () => {
    const name = datasetName.trim();
    if (!name) {
      return `Dataset ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return name;
  };

  const handleFile = useCallback(async (file: File) => {
    setIsSaving(true);
    try {
      const records = await parseCSV(file);
      const name = getDatasetName() || file.name.replace('.csv', '');
      await saveSalesData(records, name);
      toast.success(`Saved ${records.length} records as "${name}"`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse CSV');
    } finally {
      setIsSaving(false);
    }
  }, [saveSalesData, navigate, datasetName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
    else toast.error('Please upload a CSV file');
  }, [handleFile]);

  const handleSampleData = async () => {
    setIsSaving(true);
    try {
      const data = generateSampleData();
      const name = getDatasetName() || 'Sample Data';
      await saveSalesData(data, name);
      toast.success(`Saved ${data.length} sample records as "${name}"`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save sample data');
    } finally {
      setIsSaving(false);
    }
  };

  const addManualRow = () => {
    setManualRows(prev => [...prev, { productName: '', category: '', dateOfSale: '', quantitySold: 0, revenue: 0 }]);
  };

  const updateManualRow = (index: number, field: string, value: string | number) => {
    setManualRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeManualRow = (index: number) => {
    setManualRows(prev => prev.filter((_, i) => i !== index));
  };

  const submitManualData = async () => {
    const records: SalesRecord[] = manualRows
      .filter(r => r.productName)
      .map((r, i) => ({
        id: `manual-${i}`,
        productName: r.productName || '',
        category: r.category || 'Uncategorized',
        dateOfSale: r.dateOfSale || new Date().toISOString().slice(0, 10),
        quantitySold: Number(r.quantitySold) || 0,
        revenue: Number(r.revenue) || 0,
      }));

    if (records.length === 0) {
      toast.error('Please enter at least one product');
      return;
    }

    setIsSaving(true);
    try {
      const name = getDatasetName() || 'Manual Entry';
      await saveSalesData([...salesData, ...records], name);
      toast.success(`Added & saved ${records.length} records`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Sales Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Import CSV files or enter data manually. Each upload is saved as a named dataset.</p>
      </div>

      {/* Dataset Name */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <label className="text-sm font-medium text-foreground mb-2 block">Dataset Name</label>
        <Input
          placeholder="e.g. Q1 2026 Sales, January Report..."
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-1.5">Leave blank for auto-generated name</p>
      </motion.div>

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving to database...
        </div>
      )}

      {/* CSV Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`glass-card p-10 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-primary/50 glow-primary' : ''}`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-foreground font-medium">Drop your CSV file here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-2">
          Expected columns: Product Name, Category, Date of Sale, Quantity Sold, Revenue
        </p>
      </motion.div>

      {/* Sample Data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <button
          onClick={handleSampleData}
          disabled={isSaving}
          className="w-full glass-card p-4 flex items-center gap-3 hover:border-accent/50 transition-all disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Load Sample Data</p>
            <p className="text-xs text-muted-foreground">Try with 90 days of multi-category demo data</p>
          </div>
        </button>
      </motion.div>

      {/* Manual Entry */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Manual Entry</h3>
          </div>
          <button onClick={addManualRow} className="text-xs text-primary flex items-center gap-1 hover:opacity-80">
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>

        <div className="space-y-3">
          {manualRows.map((row, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-center">
              <input placeholder="Product Name" value={row.productName || ''} onChange={(e) => updateManualRow(i, 'productName', e.target.value)} className="col-span-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Category" value={row.category || ''} onChange={(e) => updateManualRow(i, 'category', e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="date" value={row.dateOfSale || ''} onChange={(e) => updateManualRow(i, 'dateOfSale', e.target.value)} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="number" placeholder="Qty" value={row.quantitySold || ''} onChange={(e) => updateManualRow(i, 'quantitySold', Number(e.target.value))} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="number" placeholder="Revenue" value={row.revenue || ''} onChange={(e) => updateManualRow(i, 'revenue', Number(e.target.value))} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={() => removeManualRow(i)} className="text-muted-foreground hover:text-destructive transition-colors justify-self-center">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={submitManualData}
          disabled={isSaving}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Add to Dataset
        </button>
      </motion.div>
    </div>
  );
}
