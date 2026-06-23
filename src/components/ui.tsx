import type { ReactNode } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-maroon-700 text-white shadow-sm hover:bg-maroon-800',
        variant === 'secondary' && 'border border-line bg-white text-ink hover:border-maroon-700 hover:text-maroon-800',
        variant === 'ghost' && 'text-muted hover:bg-maroon-100 hover:text-maroon-900',
        variant === 'danger' && 'bg-danger text-white hover:bg-red-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70', props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn('h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink', props.className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-lg border border-line bg-white shadow-sm', className)}>{children}</section>;
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'maroon' | 'blue' | 'purple' | 'orange' | 'green' | 'amber' | 'red' | 'muted' }) {
  const tones = {
    maroon: 'bg-maroon-700 text-white',
    blue: 'bg-blue-50 text-cases ring-blue-100',
    purple: 'bg-purple-50 text-docs ring-purple-100',
    orange: 'bg-orange-50 text-corr ring-orange-100',
    green: 'bg-green-50 text-success ring-green-100',
    amber: 'bg-amber-50 text-warning ring-amber-100',
    red: 'bg-red-50 text-confidential ring-red-100',
    muted: 'bg-gray-100 text-muted ring-gray-200',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', tones[tone])}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'Open' ? 'blue' : status === 'Closed' || status === 'Responded' ? 'green' : status === 'Pending' || status === 'Awaiting Response' || status === 'In Progress' ? 'amber' : status === 'Under Review' ? 'purple' : status === 'Active' ? 'green' : status === 'Draft' ? 'muted' : 'red';
  return <Badge tone={tone}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone = priority === 'Critical' ? 'red' : priority === 'High' ? 'orange' : priority === 'Medium' ? 'amber' : 'muted';
  return <Badge tone={tone}>{priority}</Badge>;
}

export function ConfidentialityBadge({ level }: { level: string }) {
  const tone = level === 'Restricted' ? 'red' : level === 'Confidential' ? 'amber' : level === 'Internal' ? 'blue' : 'green';
  return <Badge tone={tone}>{level}</Badge>;
}

export function ConfidentialBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-confidential px-2.5 py-1 text-xs font-bold text-white">
      <Lock className="h-3.5 w-3.5" /> Confidential
    </span>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-normal text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-base text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-maroon-700" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-auto rounded-lg border border-line bg-white"><table className="w-full min-w-[760px] border-collapse text-left text-sm">{children}</table></div>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-line bg-maroon-100/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted">{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('border-b border-line px-4 py-3 align-top', className)}>{children}</td>;
}
