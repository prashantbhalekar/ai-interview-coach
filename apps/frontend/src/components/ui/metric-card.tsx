import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MetricCardProps {
  label: string;
  value: number | string | null;
  supportingText: string;
  icon: ReactNode;
  progressValue?: number;
}

export function MetricCard({ label, value, supportingText, icon, progressValue }: MetricCardProps) {
  return (
    <Card className="metric-card">
      <div className="metric-card-head">
        <span className="metric-icon" aria-hidden="true">
          {icon}
        </span>
        <p className="metric-label">{label}</p>
      </div>
      <p className="metric-value">{value ?? '--'}</p>
      <p className="metric-supporting">{supportingText}</p>
      {typeof progressValue === 'number' ? (
        <Progress label={label} value={progressValue} compact showValue={false} />
      ) : null}
    </Card>
  );
}
