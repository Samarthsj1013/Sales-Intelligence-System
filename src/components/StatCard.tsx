import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, subtitle, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("stat-card", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-2 text-foreground">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === 'up' && "text-success",
              trend === 'down' && "text-danger",
              (!trend || trend === 'neutral') && "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          trend === 'up' && "bg-success/10",
          trend === 'down' && "bg-danger/10",
          (!trend || trend === 'neutral') && "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            trend === 'up' && "text-success",
            trend === 'down' && "text-danger",
            (!trend || trend === 'neutral') && "text-primary"
          )} />
        </div>
      </div>
    </motion.div>
  );
}
