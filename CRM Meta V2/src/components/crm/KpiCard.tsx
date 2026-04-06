interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: number; // Porcentagem de variação (ex: +5.2 ou -3.0)
}

const KpiCard = ({ label, value, icon, trend }: KpiCardProps) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 xl:p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] xl:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
        {icon && <span className="text-muted-foreground flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-xl lg:text-lg xl:text-2xl font-bold text-card-foreground tracking-tight">{value}</div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center text-[10px] xl:text-xs font-bold px-1.5 py-0.5 rounded-full ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
            }`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
