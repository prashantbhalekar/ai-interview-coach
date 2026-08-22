interface ProgressProps {
  label: string;
  value: number;
}

export function Progress({ label, value }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap">
      <div className="progress-row">
        <span>{label}</span>
        <strong>{clamped}%</strong>
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
