import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "飞行者图鉴",
  description: "一个用最简单方式搭起来的航空科普前端演示站，已接入本地后端接口。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
