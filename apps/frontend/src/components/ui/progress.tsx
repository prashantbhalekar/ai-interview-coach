interface ProgressProps {
  label: string;
  value: number;
  compact?: boolean;
  showValue?: boolean;
}

export function Progress({ label, value, compact = false, showValue = true }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={['progress-wrap', compact ? 'progress-compact' : ''].filter(Boolean).join(' ')}>
      <div className="progress-row">
        <span>{label}</span>
        {showValue ? <strong>{clamped}%</strong> : null}
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <span className="progress-value" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
