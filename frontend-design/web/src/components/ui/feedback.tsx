"use client";

import type { ReactNode } from "react";

type NoticeProps = {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  live?: "polite" | "assertive" | "off";
};

export function Notice({
  tone = "info",
  title,
  children,
  actions,
  className = "",
  live = "polite",
}: NoticeProps) {
  return (
    <div className={`status-banner ${tone} ${className}`.trim()} role="status" aria-live={live}>
      <div className="status-banner-copy">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
      {actions ? <div className="status-banner-actions">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        FG
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </div>
  );
}

export function LoadingState({
  label = "正在加载",
  description = "请稍候，内容正在同步。",
  compact = false,
}: {
  label?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={`loading-state ${compact ? "compact" : ""}`.trim()} role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
