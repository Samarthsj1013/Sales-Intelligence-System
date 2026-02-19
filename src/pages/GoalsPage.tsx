import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useSales, useFilteredSales } from '@/context/SalesContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { computeProductSummaries, computeCategoryPerformance } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  dataset_name: string;
  target_type: string;
  target_scope: string;
  scope_value: string | null;
  target_value: number;
}

export default function GoalsPage() {
  const { salesData, activeDataset } = useSales();
  const filteredData = useFilteredSales();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [targetType, setTargetType] = useState('revenue');
  const [targetScope, setTargetScope] = useState('overall');
  const [scopeValue, setScopeValue] = useState('');
  const [targetValue, setTargetValue] = useState('');

  const products = useMemo(() => computeProductSummaries(filteredData), [filteredData]);
  const categories = useMemo(() => computeCategoryPerformance(filteredData), [filteredData]);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (data) setGoals(data as Goal[]);
  }, [user]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const addGoal = async () => {
    if (!user || !activeDataset || !targetValue) { toast.error('Fill all fields'); return; }
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      dataset_name: activeDataset,
      target_type: targetType,
      target_scope: targetScope,
      scope_value: targetScope === 'overall' ? null : scopeValue,
      target_value: Number(targetValue),
    });
    if (error) { toast.error('Failed to save goal'); return; }
    toast.success('Goal added');
    setShowForm(false);
    setTargetValue('');
    setScopeValue('');
    loadGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  const getProgress = (goal: Goal) => {
    let current = 0;
    const data = filteredData;
    if (goal.target_scope === 'overall') {
      current = data.reduce((s, r) => s + (goal.target_type === 'revenue' ? r.revenue : r.quantitySold), 0);
    } else if (goal.target_scope === 'product') {
      current = data.filter(r => r.productName === goal.scope_value).reduce((s, r) => s + (goal.target_type === 'revenue' ? r.revenue : r.quantitySold), 0);
    } else if (goal.target_scope === 'category') {
      current = data.filter(r => r.category === goal.scope_value).reduce((s, r) => s + (goal.target_type === 'revenue' ? r.revenue : r.quantitySold), 0);
    }
    const pct = goal.target_value > 0 ? Math.min((current / goal.target_value) * 100, 100) : 0;
    return { current, pct };
  };

  if (salesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Target className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">No Data Yet</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload data to start tracking goals</p>
        <button onClick={() => navigate('/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Upload Data</button>
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.dataset_name === activeDataset);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goal Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Set revenue & sales targets and track progress</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Goal
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue (₹)</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Scope</label>
              <Select value={targetScope} onValueChange={(v) => { setTargetScope(v); setScopeValue(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall</SelectItem>
                  <SelectItem value="product">Per Product</SelectItem>
                  <SelectItem value="category">Per Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetScope !== 'overall' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{targetScope === 'product' ? 'Product' : 'Category'}</label>
                <Select value={scopeValue} onValueChange={setScopeValue}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {targetScope === 'product'
                      ? products.map(p => <SelectItem key={p.productName} value={p.productName}>{p.productName}</SelectItem>)
                      : categories.map(c => <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Target</label>
              <Input type="number" placeholder="e.g. 100000" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </div>
          </div>
          <Button onClick={addGoal} size="sm">Save Goal</Button>
        </motion.div>
      )}

      {activeGoals.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No goals set for this dataset. Click "Add Goal" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal, i) => {
            const { current, pct } = getProgress(goal);
            const isComplete = pct >= 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn("glass-card p-5", isComplete && "border-success/50")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isComplete ? "bg-success/10" : "bg-primary/10")}>
                      {isComplete ? <TrendingUp className="w-4 h-4 text-success" /> : <Target className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {goal.target_type === 'revenue' ? 'Revenue' : 'Quantity'} Target
                        {goal.scope_value && <span className="text-muted-foreground font-normal"> — {goal.scope_value}</span>}
                        {goal.target_scope === 'overall' && <span className="text-muted-foreground font-normal"> — Overall</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goal.target_type === 'revenue' ? `₹${current.toLocaleString('en-IN')}` : current.toLocaleString('en-IN')} / {goal.target_type === 'revenue' ? `₹${goal.target_value.toLocaleString('en-IN')}` : goal.target_value.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-bold", isComplete ? "text-success" : "text-foreground")}>{pct.toFixed(0)}%</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress value={pct} className={cn("h-2", isComplete && "[&>div]:bg-success")} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
