import { useRef, useState, type FormEvent } from 'react';
import { BarChart3, BriefcaseBusiness, Building2, FileText, GitBranch, LayoutDashboard, Search, ShieldCheck, SquareLibrary, Users, Bell, LogOut, MessageSquarePlus, Send, Star, X, CheckCheck, BriefcaseBusiness as CaseIcon, FileText as DocIcon, Mail } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROLES } from '@/config/enums';
import { useSession } from '@/context/useSession';
import { usePermission } from '@/hooks/usePermission';
import { NotificationProvider } from '@/context/NotificationContext';
import { useNotifications } from '@/context/useNotifications';
import { Button, Select, Textarea } from './ui';
import type { Notification } from '@/types';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases', label: 'Matters', icon: BriefcaseBusiness },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/correspondence', label: 'CEO Letters', icon: SquareLibrary },
  { to: '/entities', label: 'Entities', icon: Building2 },
  { to: '/search', label: 'Search', icon: GitBranch },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/rbac', label: 'RBAC', icon: ShieldCheck },
];

const feedbackTypes = ['Issue', 'Suggestion', 'Question', 'Praise'];

function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);

  function close() {
    setOpen(false);
    window.setTimeout(() => {
      setSubmitted(false);
      setRating(0);
    }, 180);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedbackType = (form.elements.namedItem('feedbackType') as HTMLSelectElement)?.value;
    const message      = (form.elements.namedItem('message')      as HTMLTextAreaElement)?.value;
    const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'submitFeedback',
            feedbackType,
            message,
            rating,
            page: window.location.pathname,
          }),
        });
      } catch {
        // silently fail — feedback panel still closes
      }
    }
    setSubmitted(true);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          <div className="flex items-start justify-between bg-maroon-800 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Share Feedback</p>
              <p className="mt-0.5 text-xs text-white/70">Legal Management System</p>
            </div>
            <button type="button" onClick={close} className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white" aria-label="Close feedback">
              <X className="h-4 w-4" />
            </button>
          </div>
          {submitted ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-50 text-success">
                <Send className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-ink">Thank you</h2>
              <p className="mt-1 text-sm text-muted">Your feedback has been noted for the prototype review.</p>
              <Button className="mt-5 w-full" type="button" onClick={close}>Done</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 p-5">
              <label className="space-y-1">
                <span className="text-sm font-semibold">Feedback type</span>
                <Select name="feedbackType">
                  {feedbackTypes.map((type) => <option key={type}>{type}</option>)}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold">Message</span>
                <Textarea name="message" required maxLength={1200} placeholder="What should we improve or review?" />
              </label>
              <div>
                <span className="text-sm font-semibold">Page rating</span>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} className="rounded-full p-1 text-warning transition hover:bg-amber-50" aria-label={`Rate ${value} stars`}>
                      <Star className={`h-5 w-5 ${value <= rating ? 'fill-current' : 'text-muted/35'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" type="submit">
                <Send className="h-4 w-4" />
                Submit Feedback
              </Button>
            </form>
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-maroon-800 px-4 text-sm font-bold text-white shadow-lift transition hover:bg-maroon-900"
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
        {open ? 'Close' : 'Feedback'}
      </button>
    </div>
  );
}

const NOTIF_ICONS: Record<Notification['entityType'], typeof CaseIcon> = {
  case: CaseIcon,
  document: DocIcon,
  correspondence: Mail,
};

const NOTIF_LABELS: Record<Notification['type'], string> = {
  case_created: 'New case',
  case_assigned: 'Assigned to you',
  case_status_changed: 'Status changed',
  document_uploaded: 'Document uploaded',
  correspondence_pending_approval: 'Pending approval',
  correspondence_approved: 'Approved',
  correspondence_rejected: 'Rejected',
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  function handleNotifClick(notif: Notification) {
    if (!notif.read) void markRead(notif.id);
    setOpen(false);
    navigate(notif.linkTo);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5 shrink-0 stroke-[2.25]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* panel */}
          <div
            ref={panelRef}
            className="absolute right-0 top-12 z-50 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line bg-maroon-800 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-bold">Notifications</p>
                <p className="mt-0.5 text-xs text-white/70">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-line">
              {notifications.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No notifications yet.</p>
              ) : (
                notifications.map((notif) => {
                  const Icon = NOTIF_ICONS[notif.entityType];
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full px-4 py-3 text-left transition hover:bg-paper flex items-start gap-3 ${notif.read ? 'opacity-60' : ''}`}
                    >
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${notif.read ? 'bg-paper text-muted' : 'bg-maroon-50 text-maroon-800'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${notif.read ? 'text-muted' : 'text-maroon-700'}`}>
                            {NOTIF_LABELS[notif.type]}
                          </span>
                          {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-ink line-clamp-1">{notif.title}</p>
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{notif.body}</p>
                        <p className="mt-1 text-[11px] text-muted/70">
                          {new Date(notif.createdAt).toLocaleDateString('en-PG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AppShellInner() {
  const { currentUser, setRole } = useSession();
  const { can } = usePermission();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-24 flex-col items-center overflow-hidden rounded-r-3xl bg-maroon-950 py-5 text-white shadow-lift">
        <NavLink to="/" className="mb-5 grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full bg-white p-1 shadow-soft ring-2 ring-white/15" aria-label="SCPNG Legal dashboard">
          <img src="/images/scpng-official-logo.png" alt="SCPNG logo" className="h-[85%] w-[85%] object-contain" />
        </NavLink>
        <nav className="sidebar-scrollable flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden px-2 pb-3">
          {nav.map((item) => {
            if (item.to === '/reports' && can('viewReports') === 'none') return null;
            if (item.to === '/entities' && can('viewEntities') === 'none') return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex w-16 shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-semibold leading-tight transition ${isActive ? 'bg-white/14 text-white' : 'text-white/72 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Icon className="h-[18px] w-[18px] stroke-[2.35]" />
                <span className="w-full text-center">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button className="mb-2 mt-3 flex shrink-0 flex-col items-center gap-1 text-[11px] text-white/70 transition hover:text-white" aria-label="Log out">
          <LogOut className="h-[18px] w-[18px] stroke-[2.35]" /> Logout
        </button>
      </aside>
      <div className="pl-24">
        <header className="sticky top-0 z-30 px-10 pt-3">
          <div className="flex h-20 items-center gap-5 rounded-[28px] bg-maroon-800 px-5 text-white shadow-lift">
            <button onClick={() => navigate('/search')} className="flex h-14 min-w-[360px] max-w-2xl flex-1 items-center gap-3 rounded-2xl border border-white/20 bg-white/12 px-4 text-left text-lg text-white/90">
              <Search className="h-5 w-5 shrink-0 stroke-[2.25]" /> Search matters, documents, correspondence, entities...
            </button>
            <div className="ml-auto flex shrink-0 items-center gap-5">
              <NotificationBell />
              <div className="hidden items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 lg:flex">
                <Users className="h-4 w-4 shrink-0 stroke-[2.35]" />
                <Select value={currentUser.role} onChange={(event) => setRole(event.target.value as typeof currentUser.role)} className="h-9 w-52 border-white/20 bg-white text-ink">
                  {ROLES.map((role) => <option key={role}>{role}</option>)}
                </Select>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-black text-maroon-800">{currentUser.name.split(' ').map((part) => part[0]).join('')}</div>
            </div>
          </div>
        </header>
        <main className="px-10 py-8">
          <Outlet />
        </main>
      </div>
      <FeedbackButton />
    </div>
  );
}

export function AppShell() {
  const { currentUser } = useSession();
  return (
    <NotificationProvider userId={currentUser.id}>
      <AppShellInner />
    </NotificationProvider>
  );
}
