"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/search", label: "搜索" },
  { href: "/compare", label: "对比" },
  { href: "/events", label: "事件" },
  { href: "/persons", label: "人物" },
  { href: "/me", label: "我的" },
  { href: "/admin/dashboard", label: "后台" },
];

type AppShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="page-shell">
      <div className="page-grid">
        <header className="site-header">
          <div className="site-brand">
            <div className="flex items-center gap-3">
              <div className="site-brand-mark">FG</div>
              <div className="site-brand-copy">
                <p className="eyebrow">Flyer Guide</p>
                <p className="title">飞行者图鉴</p>
                <p className="meta">航空器 · 大事件 · 航空人物 · 后台管理</p>
              </div>
            </div>
            <span className="code-chip">航空科普 Demo</span>
          </div>

          <div className="site-header-grid">
            <div className="site-hero">
              <span className="site-kicker">开放型航空知识平台</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
              <nav className="site-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={pathname === item.href ? "active" : ""}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {actions ? <div className="site-hero-actions">{actions}</div> : null}
            </div>

            <div className="site-hero-side">
              <div className="hero-note">
                <div className="label">展示重点</div>
                <div className="value">更适合答辩演示的科普界面</div>
                <div className="desc">突出结构化知识、对比能力和后台内容管理闭环。</div>
              </div>
              <div className="hero-note">
                <div className="label">当前版本</div>
                <div className="value">前后端已联调</div>
                <div className="desc">可直接进行搜索、详情浏览、对比、收藏和后台审核演示。</div>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
