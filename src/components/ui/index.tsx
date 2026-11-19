import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export function cn(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-strong shadow-sm",
  secondary: "bg-card text-text border border-border hover:border-primary",
  ghost: "text-primary hover:bg-primary-bg",
  danger: "bg-danger text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
};
const base = "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-12 px-5 text-base select-none";

export function Button({ variant = "primary", className, block, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return <button className={cn(base, variants[variant], block && "w-full", className)} {...props} />;
}

export function ButtonLink({ href, variant = "primary", className, block, children, prefetch }: { href: string; variant?: Variant; className?: string; block?: boolean; children: ReactNode; prefetch?: boolean }) {
  return <Link href={href} prefetch={prefetch} className={cn(base, variants[variant], block && "w-full", className)}>{children}</Link>;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] bg-card border border-border p-5", className)} {...props} />;
}

export function Badge({ tone = "neutral", className, children }: { tone?: "neutral" | "primary" | "success" | "danger" | "warning"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface text-muted border border-border",
    primary: "bg-primary-bg text-primary",
    success: "bg-success-bg text-success",
    danger: "bg-danger-bg text-danger",
    warning: "bg-warning-bg text-warning",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className={cn("h-2.5 w-full rounded-full bg-border overflow-hidden", className)} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="text-sm">{label}</span>
    </span>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-4 text-muted">
      {icon}
      <p className="font-semibold text-text">{title}</p>
      {children}
    </div>
  );
}

export function Notice({ tone = "primary", children, className }: { tone?: "primary" | "warning" | "danger" | "success"; children: ReactNode; className?: string }) {
  const tones = { primary: "bg-primary-bg text-text", warning: "bg-warning-bg text-text", danger: "bg-danger-bg text-text", success: "bg-success-bg text-text" };
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed", tones[tone], className)}>{children}</div>;
}

/** English learning content: isolated LTR run inside RTL text. */
export function En({ children, block, className }: { children: ReactNode; block?: boolean; className?: string }) {
  if (block) return <div dir="ltr" lang="en" className={cn("en-block", className)}>{children}</div>;
  return <bdi dir="ltr" lang="en" className={className}>{children}</bdi>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </Card>
  );
}
