type PanelProps = {
  title: string;
  kicker?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, kicker, rightSlot, children, className = "" }: PanelProps) {
  return (
    <section className={`site-card ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {kicker ? (
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--brand)]">{kicker}</p>
          ) : null}
          <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
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
  const color =
    tone === "warning"
      ? "text-[#9a5b00]"
      : tone === "success"
        ? "text-[#1f7a43]"
        : "text-[var(--text)]";

  return (
    <div className="rounded-[1.2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
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
      ? "border-[#f0d2a7] bg-[#fff6e8] text-[#9a5b00]"
      : tone === "success"
        ? "border-[#ccebd8] bg-[#ebf8f0] text-[#1f7a43]"
        : "border-[#cfe0fb] bg-[var(--brand-soft)] text-[var(--brand)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium tracking-[0.04em] ${className}`}>
      {children}
    </span>
  );
}
