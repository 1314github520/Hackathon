"use client";

import { useMemo, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel = useMemo(
    () => navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label || "首页",
    [pathname],
  );

  return (
    <div className="page-shell">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
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
            <div className="site-brand-tools">
              <span className="code-chip">航空科普 Demo</span>
              <button
                type="button"
                className="nav-toggle"
                aria-expanded={menuOpen}
                aria-controls="site-nav"
                onClick={() => setMenuOpen((value) => !value)}
              >
                菜单
              </button>
            </div>
          </div>

          <div className="site-header-grid">
            <div className="site-hero">
              <span className="site-kicker">开放型航空知识平台</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
              <nav id="site-nav" className={`site-nav ${menuOpen ? "open" : ""}`} aria-label="主导航">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}
                    aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
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
                <div className="value">{activeLabel}模块</div>
                <div className="desc">支持响应式浏览、状态反馈、错误处理和联调演示路径。</div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="main-stack">
          {children}
        </main>
      </div>
    </div>
  );
}
