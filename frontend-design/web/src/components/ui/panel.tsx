import { useId } from "react";

type PanelProps = {
  title: string;
  kicker?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, kicker, rightSlot, children, className = "" }: PanelProps) {
  const titleId = useId();

  return (
    <section className={`site-card ${className}`} aria-labelledby={titleId}>
      <div className="panel-head">
        <div>
          {kicker ? (
            <p className="panel-kicker">{kicker}</p>
          ) : null}
          <h3 id={titleId} className="panel-title">
            {title}
          </h3>
        </div>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const colorClass =
    tone === "warning"
      ? "warning"
      : tone === "success"
        ? "success"
        : "default";

  return (
    <div className={`stat-card ${colorClass}`}>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warning" | "success";
}) {
  const className =
    tone === "warning"
      ? "warning"
      : tone === "success"
        ? "success"
        : "default";

  return (
    <span className={`ui-badge ${className}`}>
      {children}
    </span>
  );
}
