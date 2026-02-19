import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SharedDashboard {
  id: string;
  dataset_name: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function SharePage() {
  const { user } = useAuth();
  const { activeDataset, datasets } = useSales();
  const [shares, setShares] = useState<SharedDashboard[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('shared_dashboards').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setShares(data as SharedDashboard[]);
  }, [user]);

  useEffect(() => { loadShares(); }, [loadShares]);

  const createShare = async () => {
    if (!user || !activeDataset) { toast.error('Load a dataset first to share it'); return; }
    const { error } = await supabase.from('shared_dashboards').insert({
      user_id: user.id,
      dataset_name: activeDataset,
    });
    if (error) { toast.error('Failed to create share link'); return; }
    toast.success('Share link created');
    loadShares();
  };

  const deleteShare = async (id: string) => {
    await supabase.from('shared_dashboards').delete().eq('id', id);
    setShares(prev => prev.filter(s => s.id !== id));
    toast.success('Share link removed');
  };

  const toggleActive = async (share: SharedDashboard) => {
    await supabase.from('shared_dashboards').update({ is_active: !share.is_active }).eq('id', share.id);
    setShares(prev => prev.map(s => s.id === share.id ? { ...s, is_active: !s.is_active } : s));
    toast.success(share.is_active ? 'Link deactivated' : 'Link activated');
  };

  const copyLink = (share: SharedDashboard) => {
    const url = `${window.location.origin}/shared/${share.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Share Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Create read-only links to share your dashboard</p>
        </div>
        <Button onClick={createShare} disabled={!activeDataset}>
          <Share2 className="w-4 h-4 mr-1" /> Create Share Link
        </Button>
      </div>

      {!activeDataset && (
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Load a dataset from History first, then you can share it.</p>
        </div>
      )}

      {shares.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <LinkIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No share links created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((share, i) => (
            <motion.div
              key={share.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("glass-card p-5 flex items-center justify-between", !share.is_active && "opacity-60")}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", share.is_active ? "bg-success/10" : "bg-muted")}>
                  <LinkIcon className={cn("w-5 h-5", share.is_active ? "text-success" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{share.dataset_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {share.is_active ? 'Active' : 'Inactive'} · Created {new Date(share.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(share)}>
                  {copiedId === share.id ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedId === share.id ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(share)}>
                  {share.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteShare(share.id)} className="text-muted-foreground hover:text-destructive">
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
