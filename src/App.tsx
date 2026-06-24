import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Building2, CalendarDays, Check, ChevronDown, Download, Eye, FilePlus2, GitBranch, LinkIcon, Plus, Send, ShieldCheck, SlidersHorizontal, UploadCloud, X } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Badge, Button, Card, ConfidentialBadge, ConfidentialityBadge, EmptyState, Input, Modal, PageHeader, PriorityBadge, Select, StatusBadge, Table, Td, Textarea, Th } from '@/components/ui';
import { CASE_STATUSES, CASE_TYPES, CONFIDENTIAL_CLASSES, CORRESPONDENCE_ACTIONS, CORRESPONDENCE_CATEGORIES, CORRESPONDENCE_CONFIDENTIALITY, CORRESPONDENCE_PRIORITIES, CORRESPONDENCE_STATUSES, DOCUMENT_CATEGORIES, ENTITY_STATUSES, ENTITY_TYPES } from '@/config/enums';
import { PERMISSIONS, type Action } from '@/config/permissions';
import { useSession } from '@/context/useSession';
import { useCase, useCaseMutations, useCases } from '@/hooks/useCases';
import { useCorrespondence, useCorrespondenceItem, useCorrespondenceMutations } from '@/hooks/useCorrespondence';
import { useDocument, useDocumentMutations, useDocuments } from '@/hooks/useDocuments';
import { useEntities, useEntity, useEntityMutations } from '@/hooks/useEntities';
import { usePermission } from '@/hooks/usePermission';
import { useAudit, useSummary } from '@/hooks/useReports';
import { useSearch } from '@/hooks/useSearch';
import { useCreateNote, useNotes } from '@/hooks/useNotes';
import { useActivities } from '@/hooks/useActivities';
import { cn, csvDownload, formatDate, today } from '@/lib/utils';
import type { Case, CaseFilter, CaseInput, Correspondence, CorrespondenceInput, DocumentInput, Entity, EntityFilter, EntityInput, LegalDocument, User } from '@/types';

const actionLabels: Record<Action, string> = {
  viewCases: 'View cases',
  createCases: 'Create cases',
  editCases: 'Edit cases',
  closeCases: 'Close cases',
  assignCases: 'Assign cases',
  viewDocuments: 'View documents',
  uploadDocuments: 'Upload documents',
  editDocuments: 'Edit documents',
  registerCorrespondence: 'Register correspondence',
  approveCorrespondence: 'Approve correspondence',
  viewReports: 'View reports',
  userManagement: 'User management',
  viewEntities: 'View entities',
  manageEntities: 'Manage entities',
  viewNotifications: 'View notifications',
};

const statusChartColors = ['#C9D3DF', '#83002A', '#B13D65', '#D79018', '#2E9E6B', '#6B7280'];
const correspondenceChartColors = ['#2B67A8', '#D79018', '#2E9E6B'];
const documentChartColors = ['#83002A', '#B13D65', '#D79018', '#2B67A8', '#2E9E6B', '#6B7280'];
const chartTooltipStyle = { borderRadius: 12, borderColor: '#E3DDE0', boxShadow: '0 12px 32px rgba(16, 24, 40, 0.12)' };
const chartTickStyle = { fill: '#667085', fontSize: 12 };

type ChartDatum = { name: string; value: number };

function UniformBarChart({ data, colors = statusChartColors, hideXAxis = false }: { data: ChartDatum[]; colors?: string[]; hideXAxis?: boolean }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#001B3D" strokeOpacity={0.08} />
        <XAxis dataKey="name" hide={hideXAxis} axisLine={false} tickLine={false} tick={{ ...chartTickStyle, fontSize: 13 }} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={chartTickStyle} />
        <Tooltip cursor={{ fill: '#83002A0F' }} contentStyle={chartTooltipStyle} />
        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
          {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function UniformDonutChart({ data, colors, centerValue, centerLabel = 'Total' }: { data: ChartDatum[]; colors: string[]; centerValue: number; centerLabel?: string }) {
  return (
    <>
      <div className="relative h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={82} outerRadius={112} paddingAngle={4} cornerRadius={14} startAngle={90} endAngle={-270} stroke="#FFFFFF" strokeWidth={6}>
              {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="tnum text-4xl font-black text-ink">{centerValue}</p>
            <p className="text-sm font-bold text-muted">{centerLabel}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
        {data.map((item, index) => (
          <span key={item.name} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            {item.name}: {item.value}
          </span>
        ))}
      </div>
    </>
  );
}

function useEntityMap() {
  const { data = [] } = useEntities();
  return useMemo(() => new Map(data.map((entity) => [entity.entityId, entity])), [data]);
}

function EntityBadge({ id }: { id?: string | null }) {
  const { data } = useEntity(id);
  if (!id) return <span className="text-muted">None</span>;
  return data ? (
    <span className="inline-flex flex-col gap-1">
      <span className="font-semibold">{data.entityName}</span>
      <Badge tone={data.entityStatus === 'Registered' ? 'green' : data.entityStatus === 'Suspended' ? 'amber' : 'red'}>{data.entityStatus}</Badge>
    </span>
  ) : <span className="text-muted">{id}</span>;
}

function RecordLink({ to, children, tone = 'muted' }: { to: string; children: React.ReactNode; tone?: 'blue' | 'purple' | 'orange' | 'green' | 'muted' }) {
  return <Link to={to} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold hover:underline ${tone === 'blue' ? 'bg-blue-50 text-cases' : tone === 'purple' ? 'bg-purple-50 text-docs' : tone === 'orange' ? 'bg-orange-50 text-corr' : tone === 'green' ? 'bg-green-50 text-entity' : 'bg-gray-100 text-muted'}`}>{children}</Link>;
}

function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="mb-4 inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-maroon-700 hover:text-maroon-800"><ArrowLeft className="h-4 w-4" /> {children}</Link>;
}

function useBackLink(defaultTo: string, defaultLabel: string) {
  const location = useLocation();
  const state = location.state as { backTo?: string; backLabel?: string } | null;
  return {
    to: state?.backTo ?? defaultTo,
    label: state?.backLabel ?? defaultLabel,
  };
}

function ConfidentialToggle({
  checked,
  onChange,
  title = 'Confidential matter',
  description = 'Restricts access and flags this case as sensitive in the register.',
  locked = false,
  lockedHint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  description?: string;
  locked?: boolean;
  lockedHint?: string;
}) {
  return (
    <div className="md:col-span-2">
      <label className={`group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${checked ? 'border-confidential bg-red-50 shadow-sm ring-2 ring-confidential/15' : 'border-red-100 bg-red-50/45 hover:border-confidential/45 hover:bg-red-50'}`}>
        <span className="flex min-w-0 items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${checked ? 'bg-confidential text-white' : 'bg-white text-confidential ring-1 ring-red-100'}`}>
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-confidential">{title}</span>
            <span className="mt-0.5 block text-xs font-medium text-muted">{description}</span>
          </span>
        </span>
        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-black ${checked ? 'bg-confidential text-white' : 'bg-white text-confidential ring-1 ring-red-100'}`}>
          {checked ? 'Enabled' : 'Standard'}
        </span>
        <input name="isConfidential" type="checkbox" checked={checked} onChange={(event) => { if (locked) return; onChange(event.target.checked); }} className="sr-only" />
      </label>
      {locked && lockedHint ? <p className="mt-1.5 px-1 text-xs font-semibold text-muted">{lockedHint}</p> : null}
    </div>
  );
}

function searchResultId(result: NonNullable<ReturnType<typeof useSearch>['data']>[number]) {
  return result.kind === 'entity' ? result.record.entityId : result.record.id;
}

function searchResultTitle(result: NonNullable<ReturnType<typeof useSearch>['data']>[number]) {
  if (result.kind === 'entity') return result.record.entityName;
  if (result.kind === 'case') return result.record.caseNumber;
  if (result.kind === 'document') return result.record.documentNumber;
  return result.record.correspondenceNumber;
}

function DashboardPage() {
  const { data: summary } = useSummary();
  const cases = useCases().data ?? [];
  const docs = useDocuments().data ?? [];
  const corr = useCorrespondence().data ?? [];
  const { currentUser } = useSession();
  const { canDo } = usePermission();
  const statusData = CASE_STATUSES.map((status) => ({ name: status, value: cases.filter((item) => item.status === status).length })).filter((item) => item.value);
  const correspondenceData = ['Open', 'Awaiting Response', 'Closed'].map((status) => ({ name: status, value: corr.filter((item) => item.status === status).length })).filter((item) => item.value);
  const correspondenceTotal = correspondenceData.reduce((total, item) => total + item.value, 0);
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser.name.split(' ')[0] ?? currentUser.name;
  const quickActions = [
    canDo('createCases') ? { to: '/cases', label: 'Register Case', detail: 'Open a new legal matter', icon: Plus } : null,
    canDo('uploadDocuments') ? { to: '/documents', label: 'Upload Document', detail: 'Add repository material', icon: FilePlus2 } : null,
    canDo('registerCorrespondence') ? { to: '/correspondence', label: 'New Correspondence', detail: 'Record CEO letters', icon: Send } : null,
    canDo('viewReports') ? { to: '/reports', label: 'View Reports', detail: 'Review legal activity', icon: Eye } : null,
  ].filter(Boolean).slice(0, 3) as Array<{ to: string; label: string; detail: string; icon: typeof Plus }>;
  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-maroon-900 px-8 py-8 text-white shadow-lift">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_26%),linear-gradient(120deg,rgba(152,0,46,0.88),rgba(53,0,11,0.92))]" />
        <div className="absolute inset-y-0 right-0 hidden w-[46%] opacity-35 lg:block">
          <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0_28%,rgba(255,255,255,0.16)_28%_29%,transparent_29%_48%,rgba(255,255,255,0.12)_48%_49%,transparent_49%),linear-gradient(90deg,transparent,rgba(255,255,255,0.12))]" />
        </div>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-semibold text-white/90 ring-1 ring-white/20">
              <CalendarDays className="h-4 w-4" />
              {todayLabel}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-normal md:text-5xl">{greeting}, {firstName}</h1>
            <p className="mt-3 max-w-2xl text-lg font-semibold text-white/88">Welcome back to the SCPNG Legal Management System.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-maroon-800">{currentUser.name}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">{currentUser.role}</span>
            </div>
          </div>
          <div className="min-w-[min(100%,430px)] lg:max-w-lg">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-white/65">Quick Actions</p>
            <div className="grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.to} className="group flex items-center gap-3 rounded-xl bg-white/12 p-3 text-white ring-1 ring-white/18 transition hover:bg-white hover:text-maroon-900">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-maroon-800 transition group-hover:bg-maroon-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{action.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-white/68 transition group-hover:text-maroon-800/70">{action.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Open Cases', summary?.openCases ?? 0, 'Active legal matters'],
          ['High-Risk Matters', summary?.highRiskMatters ?? 0, 'Confidential or litigation'],
          ['Documents', docs.length, 'Repository records'],
          ['Awaiting Response', summary?.awaitingResponse ?? 0, 'CEO correspondence'],
        ].map(([label, value, detail]) => (
          <Card key={label} className="p-5">
            <p className="text-sm font-semibold text-muted">{label}</p>
            <p className="tnum mt-3 text-4xl font-black text-maroon-800">{value}</p>
            <p className="mt-2 text-sm text-muted">{detail}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Cases by Status</h2>
          <div className="h-72">
            <UniformBarChart data={statusData} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold">CEO Correspondence Status</h2>
          <p className="text-sm text-muted">Round status view of CEO letters</p>
          <UniformDonutChart data={correspondenceData} colors={correspondenceChartColors} centerValue={correspondenceTotal} />
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-lg font-bold">Recent CEO Correspondence</h2>
        <div className="space-y-3">
          {corr.slice(0, 5).map((item) => (
            <Link key={item.id} to={`/correspondence/${item.id}`} className="block rounded-lg border border-line p-3 hover:border-maroon-700">
              <div className="flex items-center justify-between gap-3"><strong>{item.correspondenceNumber}</strong><StatusBadge status={item.status} /></div>
              <p className="mt-1 text-sm text-muted">{item.subject}</p>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function CaseTeamPicker({ users, selectedIds, onToggle }: { users: User[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));
  return (
    <div className="space-y-2">
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 pl-3 pr-2 py-1 text-xs font-semibold text-white">
              {u.name}
              <button type="button" onClick={() => onToggle(u.id)} className="flex items-center justify-center rounded-full hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => { setDropdownOpen((v) => !v); setSearch(''); }}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-3 text-sm text-muted hover:border-maroon-700 focus:outline-none"
        >
          <span>{selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Search team members...'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {dropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-line bg-white shadow-lg">
            <div className="border-b border-line p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-maroon-700"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted">No staff found.</div>
              ) : (
                filtered.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onToggle(u.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-maroon-100/50"
                    >
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', isSelected ? 'border-maroon-700 bg-maroon-700' : 'border-line bg-white')}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium text-ink">{u.name}</div>
                        <div className="text-xs text-muted">{u.role}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CaseForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser, users } = useSession();
  const { data: entities = [] } = useEntities();
  const { createCase } = useCaseMutations();
  const navigate = useNavigate();
  const [isConfidential, setIsConfidential] = useState(false);
  const [responsibleOfficerId, setResponsibleOfficerId] = useState(currentUser.id);
  const [teamUserIds, setTeamUserIds] = useState<string[]>([]);
  useEffect(() => { if (open) setTeamUserIds([]); }, [open]);
  const officerOptions = users.filter((user) => user.role.includes('Legal') || user.role === 'General Counsel');
  const grantableUsers = users.filter((user) => (user.role.includes('Legal') || user.role === 'General Counsel' || user.role === 'Executive Officer') && user.id !== responsibleOfficerId);
  const teamUsers = grantableUsers.filter((u) => teamUserIds.includes(u.id));
  function toggleTeamUser(id: string) {
    setTeamUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const confidential = form.get('isConfidential') === 'on';
    const viewGrants: string[] = [];
    const editGrants: string[] = [];
    for (const user of teamUsers) {
      const access = String(form.get(`access-${user.id}`) ?? 'none');
      if (access === 'view' || access === 'edit') viewGrants.push(user.id);
      if (access === 'edit') editGrants.push(user.id);
    }
    const needsAutoGrant = confidential && currentUser.role !== 'CEO' && currentUser.role !== 'General Counsel' && responsibleOfficerId !== currentUser.id && !viewGrants.includes(currentUser.id);
    const input: CaseInput = {
      caseTitle: String(form.get('caseTitle')),
      entityId: String(form.get('entityId')),
      caseType: String(form.get('caseType')) as CaseInput['caseType'],
      description: String(form.get('description')),
      responsibleOfficerId,
      status: String(form.get('status')) as CaseInput['status'],
      dateOpened: String(form.get('dateOpened')),
      dateClosed: null,
      isConfidential: confidential,
      confidentialClass: confidential ? String(form.get('confidentialClass')) as CaseInput['confidentialClass'] : null,
      grantedUserIds: needsAutoGrant ? [...viewGrants, currentUser.id] : viewGrants,
      grantedEditUserIds: needsAutoGrant ? [...editGrants, currentUser.id] : editGrants,
    };
    const created = await createCase.mutateAsync(input);
    onClose();
    navigate(`/cases/${created.id}`);
  }
  return (
    <Modal title="Register Case" open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Case number: Auto-generated on save</div>
        <label className="space-y-1"><span className="text-sm font-semibold">Case title</span><Input name="caseTitle" required minLength={3} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId" defaultValue="" required><option value="" disabled>Select entity</option>{entities.map((entity) => <option key={entity.entityId} value={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Case type</span><Select name="caseType">{CASE_TYPES.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Responsible officer</span><Select name="responsibleOfficerId" value={responsibleOfficerId} onChange={(event) => setResponsibleOfficerId(event.target.value)}>{officerOptions.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.role}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="status" defaultValue="Draft">{CASE_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <div className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold">Case team</span>
          <p className="text-xs text-muted">Senior Legal Officers, Legal Officers, and Executive Officers can only see and work on cases they own or are added to here. Choose what access anyone else gets.</p>
          <CaseTeamPicker users={grantableUsers} selectedIds={teamUserIds} onToggle={toggleTeamUser} />
          {teamUsers.length > 0 && (
            <div className="divide-y divide-line rounded-lg border border-line">
              {teamUsers.map((user) => {
                const tier = PERMISSIONS.editCases[user.role];
                return (
                  <div key={user.id} className="grid grid-cols-[minmax(0,1fr)_12rem] items-center gap-4 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{user.name} <span className="text-xs text-muted">({user.role})</span></span>
                    <Select name={`access-${user.id}`} defaultValue="none" className="w-full">
                      <option value="none">No access</option>
                      {tier !== 'full' && <option value="view">Read only</option>}
                      {tier !== 'none' && <option value="edit">{tier === 'full' ? 'Grant access' : 'Read & write'}</option>}
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <label className="space-y-1"><span className="text-sm font-semibold">Registration date</span><Input type="date" name="dateOpened" defaultValue={today()} required /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Description</span><Textarea name="description" required /></label>
        <ConfidentialToggle checked={isConfidential} onChange={setIsConfidential} />
        <label className="space-y-1"><span className="text-sm font-semibold">Confidential class</span><Select name="confidentialClass" disabled={!isConfidential} required={isConfidential}>{CONFIDENTIAL_CLASSES.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={createCase.isPending}>Register Case</Button></div>
      </form>
    </Modal>
  );
}

const emptyCaseFilters: CaseFilter = { query: '', status: '', type: '', officerId: '', confidentiality: '', dateFrom: '', dateTo: '', sortBy: '', includeArchived: false };

function CaseFilters({ filters, setFilters, resetFilters, users }: { filters: CaseFilter; setFilters: React.Dispatch<React.SetStateAction<CaseFilter>>; resetFilters: () => void; users: User[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const legalUsers = users.filter((user) => user.role.includes('Legal') || user.role === 'General Counsel');
  const selectedOfficer = legalUsers.find((user) => user.id === filters.officerId);
  const activeFilters = [
    filters.status ? { key: 'status', label: `Status: ${filters.status}`, clear: () => setFilters((value) => ({ ...value, status: '' })) } : null,
    filters.type ? { key: 'type', label: `Type: ${filters.type}`, clear: () => setFilters((value) => ({ ...value, type: '' })) } : null,
    filters.officerId ? { key: 'officerId', label: `Officer: ${selectedOfficer?.name ?? filters.officerId}`, clear: () => setFilters((value) => ({ ...value, officerId: '' })) } : null,
    filters.confidentiality ? { key: 'confidentiality', label: `Confidentiality: ${filters.confidentiality === 'confidential' ? 'Confidential' : 'Standard'}`, clear: () => setFilters((value) => ({ ...value, confidentiality: '' })) } : null,
    filters.dateFrom ? { key: 'dateFrom', label: `Registered from: ${formatDate(filters.dateFrom)}`, clear: () => setFilters((value) => ({ ...value, dateFrom: '' })) } : null,
    filters.dateTo ? { key: 'dateTo', label: `Registered to: ${formatDate(filters.dateTo)}`, clear: () => setFilters((value) => ({ ...value, dateTo: '' })) } : null,
    filters.includeArchived ? { key: 'includeArchived', label: 'Includes archived', clear: () => setFilters((value) => ({ ...value, includeArchived: false })) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;
  const filterCount = activeFilters.filter((item) => item.key !== 'includeArchived').length;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <Input className="xl:max-w-md" placeholder="Search cases..." value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
          <div className="relative">
            <Button type="button" variant="secondary" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen} className="h-11">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {filterCount > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-maroon-700 px-1.5 text-xs font-black text-white">{filterCount}</span> : null}
            </Button>
            {filterOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[min(420px,calc(100vw-3rem))] rounded-lg border border-line bg-white p-4 shadow-lift">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">Filters</p>
                  <button type="button" onClick={() => setFilterOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-maroon-100 hover:text-maroon-900" aria-label="Close filters">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Status</span>
                    <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{CASE_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Type</span>
                    <Select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">All types</option>{CASE_TYPES.map((item) => <option key={item}>{item}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Officer</span>
                    <Select value={filters.officerId} onChange={(event) => setFilters({ ...filters, officerId: event.target.value })}><option value="">All officers</option>{legalUsers.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Confidentiality</span>
                    <Select value={filters.confidentiality} onChange={(event) => setFilters({ ...filters, confidentiality: event.target.value })}><option value="">All confidentiality</option><option value="standard">Standard</option><option value="confidential">Confidential</option></Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Registered from</span>
                    <Input type="date" value={filters.dateFrom ?? ''} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Registered to</span>
                    <Input type="date" value={filters.dateTo ?? ''} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
          <Select className="w-44" value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} aria-label="Sort cases">
            <option value="">Newest registered</option>
            <option value="oldest">Oldest registered</option>
            <option value="caseNumber">Case number</option>
            <option value="status">Status</option>
          </Select>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink">
            <input type="checkbox" checked={Boolean(filters.includeArchived)} onChange={(event) => setFilters({ ...filters, includeArchived: event.target.checked })} /> Archived
          </label>
          <Button variant="secondary" type="button" onClick={resetFilters}>Reset</Button>
        </div>
      </div>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((item) => (
            <button key={item.key} type="button" onClick={item.clear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-maroon-100 px-3 text-xs font-bold text-maroon-900 ring-1 ring-maroon-200 transition hover:bg-maroon-200">
              {item.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CasesPage() {
  const [filters, setFilters] = useState<CaseFilter>(emptyCaseFilters);
  const [open, setOpen] = useState(false);
  const { data: cases = [], isLoading } = useCases(filters);
  const entityMap = useEntityMap();
  const { users, currentUser } = useSession();
  const { can, canDo } = usePermission();
  const resetFilters = () => setFilters(emptyCaseFilters);
  const canCreate = canDo('createCases');
  return (
    <>
      <PageHeader title="Cases" description="Register, assign, review, and audit legal matters linked to Licensing system entities." action={canCreate ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Register Case</Button> : <Badge tone="muted">Registration restricted</Badge>} />
      {!canCreate ? <Card className="mb-4 p-4 text-sm text-muted">{currentUser.role} can view assigned matters but cannot register new cases.</Card> : null}
      <CaseFilters filters={filters} setFilters={setFilters} resetFilters={resetFilters} users={users} />
      {can('viewCases') === 'assigned' ? <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">You are viewing cases assigned to {currentUser.name}. Switch to Legal Manager, General Counsel, or CEO for the full case register.</div> : null}
      {isLoading ? <EmptyState title="Loading cases" body="Fetching legal matters from the mock service." /> : cases.length === 0 ? <EmptyState title="No cases match these filters" body={canCreate ? 'Adjust filters or register the first matter for this role.' : 'Adjust filters or switch to a role with broader case access.'} /> : (
        <Table><thead><tr><Th>Case No</Th><Th>Title</Th><Th>Entity</Th><Th>Type</Th><Th>Officer</Th><Th>Status</Th><Th>Registered</Th></tr></thead><tbody>
          {cases.map((item) => {
            const entity = entityMap.get(item.entityId);
            return <tr key={item.id} className="hover:bg-maroon-100/30"><Td><RecordLink to={`/cases/${item.id}`} tone="blue">{item.caseNumber}</RecordLink></Td><Td><div className="font-bold">{item.caseTitle}</div>{item.isConfidential && <div className="mt-2"><ConfidentialBadge /></div>}</Td><Td><div className="font-semibold">{entity?.entityName ?? item.entityId}</div>{entity ? <div className="mt-1"><Badge tone={entity.entityStatus === 'Registered' ? 'green' : entity.entityStatus === 'Suspended' ? 'amber' : 'red'}>{entity.entityStatus}</Badge></div> : null}</Td><Td>{item.caseType}</Td><Td>{users.find((user) => user.id === item.responsibleOfficerId)?.name}</Td><Td><StatusBadge status={item.status} /></Td><Td>{formatDate(item.dateOpened)}</Td></tr>;
          })}
        </tbody></Table>
      )}
      <CaseForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CaseDetailPage() {
  const { id } = useParams();
  const { data: item, isLoading } = useCase(id);
  const { data: docs = [] } = useDocuments({ caseId: id });
  const { data: corr = [] } = useCorrespondence({ caseId: id });
  const { data: relationshipEntities = [] } = useEntities();
  const { data: relationshipCases = [] } = useCases();
  const { data: relationshipDocs = [] } = useDocuments();
  const { data: relationshipCorr = [] } = useCorrespondence();
  const { data: notes = [] } = useNotes(id);
  const { data: activities = [] } = useActivities(id);
  const addNote = useCreateNote(id ?? '');
  const { updateCase } = useCaseMutations();
  const { canForCase, canDo } = usePermission();
  const { users } = useSession();
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docLinkOpen, setDocLinkOpen] = useState(false);
  const [corrRegisterOpen, setCorrRegisterOpen] = useState(false);
  const [corrLinkOpen, setCorrLinkOpen] = useState(false);
  const backLink = useBackLink('/cases', 'Back to Cases');
  if (isLoading) return <EmptyState title="Loading case" body="Resolving case access and details." />;
  if (!item) return <EmptyState title="Access restricted" body="This matter is confidential or no longer exists for the current role." />;
  const legalUsers = users.filter((user) => user.role.includes('Legal') || user.role === 'General Counsel');
  const mapCases = relationshipCases.some((caseItem) => caseItem.id === item.id) ? relationshipCases : [...relationshipCases, item];
  const canClose = canForCase('closeCases', item);
  const statusOptions = CASE_STATUSES.filter((status) => canClose || (status !== 'Closed' && status !== 'Archived'));
  const closePending = () => { setPendingStatus(null); setReason(''); };
  return (
    <>
      <BackLink to={backLink.to}>{backLink.label}</BackLink>
      <PageHeader title={`${item.caseNumber} · ${item.caseTitle}`} description={item.description} action={<div className="flex shrink-0 flex-nowrap justify-end gap-2">{item.isConfidential && <ConfidentialBadge />}{canForCase('editCases', item) && <Button variant="secondary" className="w-32" onClick={() => setEditOpen(true)}>Edit Case</Button>}{canClose && item.status !== 'Closed' && <Button className="w-32" onClick={() => setPendingStatus('Closed')}>Close Case</Button>}</div>} />
      <div className="mb-4 flex gap-2 overflow-auto">{[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: 'Documents' }, { id: 'correspondence', label: 'Correspondence' }, { id: 'notes', label: 'Notes' }, { id: 'activities', label: 'Activities' }, { id: 'relationships', label: 'Relationships' }].map((tabItem) => <Button key={tabItem.id} variant={tab === tabItem.id ? 'primary' : 'secondary'} onClick={() => setTab(tabItem.id)}>{tabItem.label}</Button>)}</div>
      {tab === 'overview' && (() => {
        const teamMembers = (item.grantedUserIds ?? []).map((userId) => users.find((user) => user.id === userId)).filter((user): user is User => Boolean(user));
        const accessLabel = (user: User) => {
          const tier = PERMISSIONS.editCases[user.role];
          if (tier === 'full') return 'Read & write';
          if (tier === 'assigned') return item.grantedEditUserIds?.includes(user.id) ? 'Read & write' : 'Read only';
          return 'Read only';
        };
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2"><h2 className="text-lg font-bold">Matter Overview</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted">Type</dt><dd className="font-semibold">{item.caseType}</dd></div><div><dt className="text-sm text-muted">Officer</dt><dd className="font-semibold">{users.find((user) => user.id === item.responsibleOfficerId)?.name}</dd></div><div><dt className="text-sm text-muted">Registered</dt><dd>{formatDate(item.dateOpened)}</dd></div><div><dt className="text-sm text-muted">Closed</dt><dd>{item.dateClosed ? formatDate(item.dateClosed) : 'Not closed'}</dd></div><div><dt className="text-sm text-muted">Status</dt><dd><StatusBadge status={item.status} /></dd></div><div><dt className="text-sm text-muted">Confidential class</dt><dd>{item.confidentialClass ?? 'Standard'}</dd></div></dl><div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold text-muted">Recent activity</h3><div className="mt-3 space-y-2">{activities.slice(0, 3).map((activity) => <div key={activity.id} className="rounded-lg bg-maroon-100/40 px-3 py-2 text-sm"><strong>{activity.type}</strong><p className="text-muted">{activity.description}</p></div>)}</div></div></Card>
            <div className="space-y-4">
              <Card className="p-5"><h2 className="mb-3 text-lg font-bold">Linked Entity</h2><EntityBadge id={item.entityId} /></Card>
              <Card className="p-5">
                <h2 className="mb-3 text-lg font-bold">Case Team</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{users.find((user) => user.id === item.responsibleOfficerId)?.name}</span>
                    <Badge tone="green">Owner · Full access</Badge>
                  </li>
                  {teamMembers.map((user) => (
                    <li key={user.id} className="flex items-center justify-between gap-2">
                      <span>{user.name} <span className="text-xs text-muted">({user.role})</span></span>
                      <Badge tone={accessLabel(user) === 'Read & write' ? 'blue' : 'muted'}>{accessLabel(user)}</Badge>
                    </li>
                  ))}
                  {teamMembers.length === 0 && <li className="text-muted">No additional team members granted.</li>}
                </ul>
              </Card>
            </div>
          </div>
        );
      })()}
      {tab === 'documents' && (
        <div className="space-y-4">
          {canDo('uploadDocuments') && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setDocLinkOpen(true)}><LinkIcon className="h-4 w-4" /> Link Existing Document</Button>
              <Button onClick={() => setDocUploadOpen(true)}><FilePlus2 className="h-4 w-4" /> Upload Document</Button>
            </div>
          )}
          <LinkedDocuments docs={docs} currentCaseId={item.id} />
        </div>
      )}
      {tab === 'correspondence' && (
        <div className="space-y-4">
          {canDo('registerCorrespondence') && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setCorrLinkOpen(true)}><LinkIcon className="h-4 w-4" /> Link Existing Correspondence</Button>
              <Button onClick={() => setCorrRegisterOpen(true)}><Send className="h-4 w-4" /> Register Correspondence</Button>
            </div>
          )}
          <LinkedCorrespondence items={corr} />
        </div>
      )}
      {tab === 'notes' && <Card className="p-5">{canForCase('editCases', item) ? <form className="mb-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); const trimmed = note.trim(); if (trimmed) { addNote.mutate(trimmed); setNote(''); } }}><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a case note..." /><Button>Add Note</Button></form> : <p className="mb-5 rounded-lg border border-line bg-maroon-100/40 px-3 py-2 text-sm text-muted">Your role can view notes on this case but cannot add them.</p>}<div className="space-y-3">{notes.map((entry) => <div key={entry.id} className="rounded-lg border border-line p-3"><p>{entry.body}</p><p className="mt-1 text-xs text-muted">{entry.createdBy} · {formatDate(entry.createdAt)}</p></div>)}</div></Card>}
      {tab === 'activities' && <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Activity Log</h2>{activities.length === 0 ? <EmptyState title="No activities yet" body="Case events, status changes, assignments, and notes will appear here." /> : <div className="space-y-3">{activities.map((activity) => <div key={activity.id} className="rounded-lg border border-line p-3"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><strong>{activity.type}</strong><span className="text-xs text-muted">{formatDate(activity.createdAt)}</span></div><p className="mt-1 text-sm text-muted">{activity.description}</p><p className="mt-1 text-xs text-muted">By {activity.createdBy}</p></div>)}</div>}</Card>}
      {tab === 'relationships' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Relationship Map</h2>
          <RelationshipMap focus={`case:${item.id}`} entities={relationshipEntities} cases={mapCases} docs={relationshipDocs} corr={relationshipCorr} />
        </Card>
      )}
      <Modal title="Change case status" open={pendingStatus !== null} onClose={closePending}>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const trimmed = reason.trim(); if (!trimmed || !pendingStatus) return; updateCase.mutate({ id: item.id, patch: { status: pendingStatus as Case['status'] }, reason: trimmed }); closePending(); }}>
          <p className="text-sm text-muted">Change status from <strong>{item.status}</strong> to <strong>{pendingStatus}</strong>. A reason is required and is recorded in the activity log and audit trail.</p>
          <label className="space-y-1"><span className="text-sm font-semibold">Reason</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} required placeholder="Why is the status changing?" /></label>
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={closePending}>Cancel</Button><Button type="submit" disabled={!reason.trim() || updateCase.isPending}>Save status</Button></div>
        </form>
      </Modal>
      <CaseEditForm item={item} open={editOpen} onClose={() => setEditOpen(false)} />
      <DocumentForm open={docUploadOpen} onClose={() => setDocUploadOpen(false)} lockedCase={item} />
      <LinkDocumentModal caseItem={item} open={docLinkOpen} onClose={() => setDocLinkOpen(false)} />
      <CorrespondenceForm open={corrRegisterOpen} onClose={() => setCorrRegisterOpen(false)} lockedCase={item} />
      <LinkCorrespondenceModal caseItem={item} open={corrLinkOpen} onClose={() => setCorrLinkOpen(false)} />
    </>
  );
}

function CaseEditForm({ item, open, onClose }: { item: Case; open: boolean; onClose: () => void }) {
  const { data: entities = [] } = useEntities();
  const { users } = useSession();
  const { can, canForCase, currentUser } = usePermission();
  const { updateCase } = useCaseMutations();
  const [isConfidential, setIsConfidential] = useState(item.isConfidential);
  const [selectedStatus, setSelectedStatus] = useState(item.status);
  useEffect(() => {
    if (open) {
      setIsConfidential(item.isConfidential);
      setSelectedStatus(item.status);
    }
  }, [open, item.isConfidential, item.status]);
  const canDowngradeConfidentiality = can('editCases') === 'full';
  const confidentialityLocked = item.isConfidential && !canDowngradeConfidentiality;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const confidential = confidentialityLocked ? true : form.get('isConfidential') === 'on';
    const nextStatus = String(form.get('status')) as CaseInput['status'];
    const statusChanged = nextStatus !== item.status;
    const reason = String(form.get('statusReason') ?? '').trim();
    const nextResponsibleOfficerId = canForCase('assignCases', item) ? String(form.get('responsibleOfficerId')) : item.responsibleOfficerId;
    const viewGrants: string[] = [];
    const editGrants: string[] = [];
    for (const user of teamUsers) {
      const access = String(form.get(`access-${user.id}`) ?? 'none');
      if (access === 'view' || access === 'edit') viewGrants.push(user.id);
      if (access === 'edit') editGrants.push(user.id);
    }
    const needsAutoGrant = confidential && currentUser.role !== 'CEO' && currentUser.role !== 'General Counsel' && nextResponsibleOfficerId !== currentUser.id && !viewGrants.includes(currentUser.id);
    const patch: Partial<CaseInput> = {
      caseTitle: String(form.get('caseTitle')),
      entityId: String(form.get('entityId')),
      caseType: String(form.get('caseType')) as CaseInput['caseType'],
      description: String(form.get('description')),
      dateOpened: String(form.get('dateOpened')),
      isConfidential: confidential,
      confidentialClass: confidential ? (confidentialityLocked ? item.confidentialClass : String(form.get('confidentialClass')) as CaseInput['confidentialClass']) : null,
      grantedUserIds: needsAutoGrant ? [...viewGrants, currentUser.id] : viewGrants,
      grantedEditUserIds: needsAutoGrant ? [...editGrants, currentUser.id] : editGrants,
    };
    if (canForCase('assignCases', item)) patch.responsibleOfficerId = nextResponsibleOfficerId;
    if (canForCase('editCases', item)) patch.status = nextStatus;
    await updateCase.mutateAsync({ id: item.id, patch, reason: statusChanged ? reason : undefined });
    onClose();
  }
  const canClose = canForCase('closeCases', item);
  const legalUsers = users.filter((user) => user.role.includes('Legal') || user.role === 'General Counsel');
  const grantableUsers = users.filter((user) => (user.role.includes('Legal') || user.role === 'General Counsel' || user.role === 'Executive Officer') && user.id !== item.responsibleOfficerId);
  const initialTeamIds = useMemo(
    () => grantableUsers.filter((u) => (item.grantedUserIds ?? []).includes(u.id)).map((u) => u.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id],
  );
  const [teamUserIds, setTeamUserIds] = useState<string[]>(initialTeamIds);
  useEffect(() => { if (open) setTeamUserIds(initialTeamIds); }, [open, initialTeamIds]);
  const teamUsers = grantableUsers.filter((u) => teamUserIds.includes(u.id));
  function toggleTeamUser(id: string) {
    setTeamUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function defaultAccessFor(user: User) {
    const tier = PERMISSIONS.editCases[user.role];
    const grantedView = item.grantedUserIds?.includes(user.id) ?? false;
    const grantedEdit = item.grantedEditUserIds?.includes(user.id) ?? false;
    if (!grantedView) return 'none';
    if (tier === 'full') return 'edit';
    if (tier === 'assigned') return grantedEdit ? 'edit' : 'view';
    return 'view';
  }
  const statusOptions = CASE_STATUSES.filter((status) => canClose || (status !== 'Closed' && status !== 'Archived'));
  const statusChanged = selectedStatus !== item.status;
  return (
    <Modal title={`Edit Case - ${item.caseNumber}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Case number: {item.caseNumber} (fixed)</div>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Case title</span><Input name="caseTitle" required minLength={3} defaultValue={item.caseTitle} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId" required defaultValue={item.entityId}>{entities.map((entity) => <option key={entity.entityId} value={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Case type</span><Select name="caseType" defaultValue={item.caseType}>{CASE_TYPES.map((type) => <option key={type}>{type}</option>)}</Select></label>
        {canForCase('assignCases', item) && <label className="space-y-1"><span className="text-sm font-semibold">Responsible officer</span><Select name="responsibleOfficerId" defaultValue={item.responsibleOfficerId}>{legalUsers.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</Select></label>}
        {canForCase('editCases', item) && (
          <label className="space-y-1">
            <span className="text-sm font-semibold">Status</span>
            <div className="flex gap-2">
              <Select name="status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as Case['status'])}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</Select>
              {canClose && item.status !== 'Closed' && selectedStatus !== 'Closed' && <Button type="button" variant="secondary" className="shrink-0" onClick={() => setSelectedStatus('Closed')}>Close Case</Button>}
            </div>
          </label>
        )}
        <div className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold">{isConfidential ? 'Granted access' : 'Case team'}</span>
          <p className="text-xs text-muted">
            {isConfidential
              ? 'The responsible officer and CEO/General Counsel can always view this case. Choose what access anyone else gets.'
              : 'Senior Legal Officers, Legal Officers, and Executive Officers can only see and work on cases they own or are added to here. Choose what access anyone else gets.'}
          </p>
          <CaseTeamPicker users={grantableUsers} selectedIds={teamUserIds} onToggle={toggleTeamUser} />
          {teamUsers.length > 0 && (
            <div className="divide-y divide-line rounded-lg border border-line">
              {teamUsers.map((user) => {
                const tier = PERMISSIONS.editCases[user.role];
                return (
                  <div key={user.id} className="grid grid-cols-[minmax(0,1fr)_12rem] items-center gap-4 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{user.name} <span className="text-xs text-muted">({user.role})</span></span>
                    <Select name={`access-${user.id}`} defaultValue={defaultAccessFor(user)} className="w-full">
                      <option value="none">No access</option>
                      {tier !== 'full' && <option value="view">Read only</option>}
                      {tier !== 'none' && <option value="edit">{tier === 'full' ? 'Grant access' : 'Read & write'}</option>}
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <label className="space-y-1"><span className="text-sm font-semibold">Registration date</span><Input type="date" name="dateOpened" defaultValue={item.dateOpened} required /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Description</span><Textarea name="description" required defaultValue={item.description} /></label>
        {statusChanged && <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Status change reason</span><Textarea name="statusReason" required placeholder={`Why is the status changing from ${item.status} to ${selectedStatus}?`} /></label>}
        <ConfidentialToggle
          checked={isConfidential}
          onChange={setIsConfidential}
          locked={confidentialityLocked}
          lockedHint={confidentialityLocked ? 'Only a Legal Manager, Senior Legal Officer, or General Counsel can remove confidentiality protection from this case.' : undefined}
        />
        <label className="space-y-1"><span className="text-sm font-semibold">Confidential class</span><Select name="confidentialClass" disabled={!isConfidential || confidentialityLocked} required={isConfidential} defaultValue={item.confidentialClass ?? undefined}>{CONFIDENTIAL_CLASSES.map((cls) => <option key={cls}>{cls}</option>)}</Select></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={updateCase.isPending}>{selectedStatus === 'Closed' && statusChanged ? 'Save & Close Case' : 'Save changes'}</Button></div>
      </form>
    </Modal>
  );
}

function LinkedDocuments({ docs, currentCaseId }: { docs: LegalDocument[]; currentCaseId?: string }) {
  if (!docs.length) return <EmptyState title="No linked documents" body="Upload or link repository documents to this record." />;
  return <Table><thead><tr><Th>No</Th><Th>Title</Th><Th>Category</Th><Th>Version</Th><Th>Status</Th><Th>Uploaded</Th></tr></thead><tbody>{docs.map((doc) => <tr key={doc.id}><Td><RecordLink to={`/documents/${doc.id}`} tone="purple">{doc.documentNumber}</RecordLink></Td><Td>{doc.title}{currentCaseId && doc.caseId !== currentCaseId && <span className="ml-2"><Badge tone="amber">Related</Badge></span>}</Td><Td>{doc.category}</Td><Td>v{doc.currentVersion}</Td><Td><StatusBadge status={doc.status} /></Td><Td>{formatDate(doc.uploadDate)}</Td></tr>)}</tbody></Table>;
}

function RelatedCaseLinks({ ids, cases }: { ids?: string[]; cases: Case[] }) {
  if (!ids?.length) return <span className="text-muted">No related cases</span>;
  return <div className="flex flex-wrap gap-2">{ids.map((caseId) => { const item = cases.find((candidate) => candidate.id === caseId); return item ? <RecordLink key={caseId} to={`/cases/${caseId}`} tone="blue">{item.caseNumber}</RecordLink> : null; })}</div>;
}

function LinkedCorrespondence({ items }: { items: Correspondence[] }) {
  if (!items.length) return <EmptyState title="No correspondence linked" body="Register CEO correspondence and link it back to this record." />;
  return <Table><thead><tr><Th>No</Th><Th>Subject</Th><Th>Category</Th><Th>Priority</Th><Th>Assigned To</Th><Th>Action Required</Th><Th>Due Date</Th><Th>Direction</Th><Th>Date</Th><Th>Status</Th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><Td><RecordLink to={`/correspondence/${item.id}`} tone="orange">{item.correspondenceNumber}</RecordLink></Td><Td>{item.subject}</Td><Td>{item.category}</Td><Td><PriorityBadge priority={item.priority} /></Td><Td>{item.assignedTo.join(', ')}</Td><Td>{item.actionRequired}</Td><Td>{item.dueDate ? formatDate(item.dueDate) : '—'}</Td><Td>{item.direction}</Td><Td>{formatDate(item.date)}</Td><Td><StatusBadge status={item.status} /></Td></tr>)}</tbody></Table>;
}

function LinkDocumentModal({ caseItem, open, onClose }: { caseItem: Case; open: boolean; onClose: () => void }) {
  const { data: docs = [] } = useDocuments();
  const { updateDocument } = useDocumentMutations();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const candidates = docs.filter((doc) => doc.caseId !== caseItem.id && !doc.relatedCaseIds?.includes(caseItem.id) && [doc.id, doc.documentNumber, doc.title].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  async function link(doc: LegalDocument) {
    if (!doc.caseId) {
      await updateDocument.mutateAsync({ id: doc.id, patch: { caseId: caseItem.id } });
    } else {
      await updateDocument.mutateAsync({ id: doc.id, patch: { relatedCaseIds: [...(doc.relatedCaseIds ?? []), caseItem.id] } });
    }
  }
  return (
    <Modal title={`Link Existing Document to ${caseItem.caseNumber}`} open={open} onClose={onClose}>
      <div className="space-y-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents by title or number..." />
        {candidates.length === 0 ? (
          <EmptyState title="No matching documents" body="All documents are already linked to this case, or none match your search." />
        ) : (
          <div className="max-h-80 space-y-2 overflow-auto">
            {candidates.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div>
                  <p className="font-semibold">{doc.documentNumber} · {doc.title}</p>
                  <p className="text-xs text-muted">{doc.category} · {doc.status}{doc.caseId ? ' · will be added as a related case (primary case unchanged)' : ''}</p>
                </div>
                <Button type="button" variant="secondary" disabled={updateDocument.isPending} onClick={() => link(doc)}>{doc.caseId ? 'Link as related' : 'Link'}</Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end"><Button variant="secondary" type="button" onClick={onClose}>Close</Button></div>
      </div>
    </Modal>
  );
}

function LinkCorrespondenceModal({ caseItem, open, onClose }: { caseItem: Case; open: boolean; onClose: () => void }) {
  const { data: items = [] } = useCorrespondence();
  const { updateCorrespondence } = useCorrespondenceMutations();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const candidates = items.filter((entry) => entry.caseId !== caseItem.id && [entry.id, entry.correspondenceNumber, entry.subject].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  async function link(id: string) {
    await updateCorrespondence.mutateAsync({ id, patch: { caseId: caseItem.id } });
  }
  return (
    <Modal title={`Link Existing Correspondence to ${caseItem.caseNumber}`} open={open} onClose={onClose}>
      <div className="space-y-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search correspondence by subject or number..." />
        {candidates.length === 0 ? (
          <EmptyState title="No matching correspondence" body="All correspondence is already linked to this case, or none match your search." />
        ) : (
          <div className="max-h-80 space-y-2 overflow-auto">
            {candidates.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div>
                  <p className="font-semibold">{entry.correspondenceNumber} · {entry.subject}</p>
                  <p className="text-xs text-muted">{entry.direction} · {formatDate(entry.date)}{entry.caseId ? ' · currently linked to another case' : ''}</p>
                </div>
                <Button type="button" variant="secondary" disabled={updateCorrespondence.isPending} onClick={() => link(entry.id)}>Link</Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end"><Button variant="secondary" type="button" onClick={onClose}>Close</Button></div>
      </div>
    </Modal>
  );
}

function DocumentForm({ open, onClose, lockedCase }: { open: boolean; onClose: () => void; lockedCase?: Case }) {
  const { data: entities = [] } = useEntities();
  const { data: cases = [] } = useCases();
  const { uploadDocument } = useDocumentMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [dragging, setDragging] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  useEffect(() => {
    if (!open) {
      setFileName('');
      setDocumentLink('');
      setDragging(false);
      setSourceError('');
      setIsConfidential(false);
    }
  }, [open]);
  function acceptFile(file?: File | null) {
    if (!file) return;
    setFileName(file.name);
    setSourceError('');
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const link = documentLink.trim();
    if (!fileName && !link) {
      setSourceError('Attach a file, drop one here, or paste a document link.');
      return;
    }
    const input: DocumentInput = {
      title: String(form.get('title')),
      category: String(form.get('category')) as DocumentInput['category'],
      fileName: fileName || link,
      sourceUrl: link || undefined,
      entityId: String(form.get('entityId')) || null,
      caseId: lockedCase ? lockedCase.id : String(form.get('caseId')) || null,
      correspondenceId: null,
      status: String(form.get('status')) as DocumentInput['status'],
      isConfidential,
      classification: isConfidential ? 'Confidential' : 'Restricted',
    };
    await uploadDocument.mutateAsync(input);
    onClose();
  }
  return (
    <Modal title="Upload Document" open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {lockedCase && <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Linked to case: {lockedCase.caseNumber} · {lockedCase.caseTitle} (fixed)</div>}
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Title</span><Input name="title" required /></label>
        <div className="md:col-span-2">
          <div
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptFile(event.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-5 transition ${dragging ? 'border-maroon-700 bg-maroon-100' : 'border-line bg-maroon-100/35 hover:border-maroon-700/60 hover:bg-maroon-100/60'}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => acceptFile(event.target.files?.[0])} />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-maroon-800 shadow-sm">
                  <UploadCloud className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-ink">Drop a file here or choose from your computer</p>
                  <p className="mt-1 text-sm text-muted">Use this for legal opinions, court documents, contracts, gazettals, or correspondence attachments.</p>
                  {fileName ? (
                    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-maroon-800 ring-1 ring-line">
                      <FilePlus2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{fileName}</span>
                      <button type="button" onClick={() => setFileName('')} className="text-muted hover:text-confidential" aria-label="Remove selected file"><X className="h-4 w-4" /></button>
                    </div>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
            </div>
          </div>
          <label className="mt-3 block space-y-1">
            <span className="flex items-center gap-2 text-sm font-semibold"><LinkIcon className="h-4 w-4" /> Paste document link</span>
            <Input value={documentLink} onChange={(event) => { setDocumentLink(event.target.value); setSourceError(''); }} placeholder="https://sharepoint/site/legal-opinion.pdf" />
          </label>
          {sourceError ? <p className="mt-2 text-sm font-semibold text-danger">{sourceError}</p> : null}
        </div>
        <label className="space-y-1"><span className="text-sm font-semibold">Category</span><Select name="category">{DOCUMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="status"><option>Draft</option><option>Active</option><option>Superseded</option><option>Archived</option></Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId"><option value="">No entity</option>{entities.map((entity) => <option value={entity.entityId} key={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        {!lockedCase && <label className="space-y-1"><span className="text-sm font-semibold">Case</span><Select name="caseId"><option value="">No case</option>{cases.map((item) => <option value={item.id} key={item.id}>{item.caseNumber} - {item.caseTitle}</option>)}</Select></label>}
        <ConfidentialToggle
          checked={isConfidential}
          onChange={setIsConfidential}
          title="Confidential document"
          description="Restricts access and flags this document as sensitive in the repository."
        />
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button disabled={uploadDocument.isPending}>Upload</Button></div>
      </form>
    </Modal>
  );
}

function DocumentEditForm({ item, open, onClose }: { item: LegalDocument; open: boolean; onClose: () => void }) {
  const { data: entities = [] } = useEntities();
  const { data: cases = [] } = useCases();
  const { updateDocument } = useDocumentMutations();
  const [isConfidential, setIsConfidential] = useState(item.isConfidential);
  useEffect(() => {
    if (open) setIsConfidential(item.isConfidential);
  }, [open, item.isConfidential]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const confidential = form.get('isConfidential') === 'on';
    const sourceUrl = String(form.get('sourceUrl') ?? '').trim();
    const patch: Partial<DocumentInput> = {
      title: String(form.get('title')),
      category: String(form.get('category')) as DocumentInput['category'],
      status: String(form.get('status')) as DocumentInput['status'],
      entityId: String(form.get('entityId')) || null,
      caseId: String(form.get('caseId')) || null,
      sourceUrl: sourceUrl || undefined,
      isConfidential: confidential,
      classification: confidential ? 'Confidential' : 'Restricted',
    };
    await updateDocument.mutateAsync({ id: item.id, patch });
    onClose();
  }
  return (
    <Modal title={`Edit Document - ${item.documentNumber}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Document number: {item.documentNumber} (fixed)</div>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Title</span><Input name="title" required minLength={3} defaultValue={item.title} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Category</span><Select name="category" defaultValue={item.category}>{DOCUMENT_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="status" defaultValue={item.status}><option>Draft</option><option>Active</option><option>Superseded</option><option>Archived</option></Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId" defaultValue={item.entityId ?? ''}><option value="">No entity</option>{entities.map((entity) => <option value={entity.entityId} key={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Case</span><Select name="caseId" defaultValue={item.caseId ?? ''}><option value="">No case</option>{cases.map((c) => <option value={c.id} key={c.id}>{c.caseNumber} - {c.caseTitle}</option>)}</Select></label>
        <label className="space-y-1 md:col-span-2"><span className="flex items-center gap-2 text-sm font-semibold"><LinkIcon className="h-4 w-4" /> Source link</span><Input name="sourceUrl" defaultValue={item.sourceUrl ?? ''} placeholder="https://sharepoint/site/legal-opinion.pdf" /></label>
        <ConfidentialToggle
          checked={isConfidential}
          onChange={setIsConfidential}
          title="Confidential document"
          description="Restricts access and flags this document as sensitive in the repository."
        />
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={updateDocument.isPending}>Save changes</Button></div>
      </form>
    </Modal>
  );
}

type DocumentListFilters = { query: string; category: string; status: string; dateFrom: string; dateTo: string; sortBy: string };
const emptyDocumentFilters: DocumentListFilters = { query: '', category: '', status: '', dateFrom: '', dateTo: '', sortBy: '' };

function DocumentFilters({ filters, setFilters, resetFilters }: { filters: DocumentListFilters; setFilters: React.Dispatch<React.SetStateAction<DocumentListFilters>>; resetFilters: () => void }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilters = [
    filters.category ? { key: 'category', label: `Category: ${filters.category}`, clear: () => setFilters((value) => ({ ...value, category: '' })) } : null,
    filters.status ? { key: 'status', label: `Status: ${filters.status}`, clear: () => setFilters((value) => ({ ...value, status: '' })) } : null,
    filters.dateFrom ? { key: 'dateFrom', label: `From: ${formatDate(filters.dateFrom)}`, clear: () => setFilters((value) => ({ ...value, dateFrom: '' })) } : null,
    filters.dateTo ? { key: 'dateTo', label: `To: ${formatDate(filters.dateTo)}`, clear: () => setFilters((value) => ({ ...value, dateTo: '' })) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <Input className="xl:max-w-md" placeholder="Search documents..." value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
          <div className="relative">
            <Button type="button" variant="secondary" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen} className="h-11">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-maroon-700 px-1.5 text-xs font-black text-white">{activeFilters.length}</span> : null}
            </Button>
            {filterOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[min(420px,calc(100vw-3rem))] rounded-lg border border-line bg-white p-4 shadow-lift">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">Document filters</p>
                  <button type="button" onClick={() => setFilterOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-maroon-100 hover:text-maroon-900" aria-label="Close document filters">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Category</span>
                    <Select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{DOCUMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Status</span>
                    <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option>Draft</option><option>Active</option><option>Superseded</option><option>Archived</option></Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Uploaded from</span>
                    <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Uploaded to</span>
                    <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
          <Select className="w-44" value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} aria-label="Sort documents">
            <option value="">Newest uploaded</option>
            <option value="oldest">Oldest uploaded</option>
            <option value="documentNumber">Document number</option>
            <option value="title">Title</option>
          </Select>
          <Button variant="secondary" type="button" onClick={resetFilters}>Reset</Button>
        </div>
      </div>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((item) => (
            <button key={item.key} type="button" onClick={item.clear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-maroon-100 px-3 text-xs font-bold text-maroon-900 ring-1 ring-maroon-200 transition hover:bg-maroon-200">
              {item.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DocumentsPage() {
  const [filters, setFilters] = useState<DocumentListFilters>(emptyDocumentFilters);
  const [open, setOpen] = useState(false);
  const { data: docs = [] } = useDocuments(filters);
  const { canDo } = usePermission();
  const { users } = useSession();
  const resetFilters = () => setFilters(emptyDocumentFilters);
  return (
    <>
      <PageHeader title="Documents" description="Versioned repository for legal opinions, court documents, contracts, gazettals, and correspondence attachments." action={canDo('uploadDocuments') ? <Button onClick={() => setOpen(true)}><FilePlus2 className="h-4 w-4" /> Upload Document</Button> : null} />
      <DocumentFilters filters={filters} setFilters={setFilters} resetFilters={resetFilters} />
      <LinkedDocuments docs={docs} />
      <DocumentForm open={open} onClose={() => setOpen(false)} />
      <div className="mt-4 text-sm text-muted">{docs.length} records · Uploaded by values resolve to demo users such as {users[1].name}.</div>
    </>
  );
}

function DocumentDetailPage() {
  const { id } = useParams();
  const { data: doc } = useDocument(id);
  const { download, addVersion } = useDocumentMutations();
  const { data: correspondence = [] } = useCorrespondence();
  const { data: cases = [] } = useCases();
  const { data: audit = [] } = useAudit();
  const { canDo } = usePermission();
  const { users } = useSession();
  const [fileName, setFileName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const backLink = useBackLink('/documents', 'Back to Documents');
  if (!doc) return <EmptyState title="Document unavailable" body="The document is restricted or does not exist." />;
  const linkedCorrespondence = correspondence.filter((item) => item.id === doc.correspondenceId || (doc.caseId && item.caseId === doc.caseId));
  const documentAudit = audit.filter((entry) => entry.recordRef === doc.documentNumber);
  const uploader = users.find((user) => user.id === doc.uploadedBy)?.name ?? doc.uploadedBy;
  return (
    <>
      <BackLink to={backLink.to}>{backLink.label}</BackLink>
      <PageHeader
        title={`${doc.documentNumber} · ${doc.title}`}
        description={`${doc.category} · ${doc.classification}`}
        action={<div className="flex shrink-0 flex-nowrap justify-end gap-2">{doc.isConfidential && <ConfidentialBadge />}{canDo('editDocuments') && <Button variant="secondary" className="w-36" onClick={() => setEditOpen(true)}>Edit Document</Button>}<Button className="w-32" onClick={() => download.mutate(doc.id)}><Download className="h-4 w-4" /> Download</Button></div>}
      />
      <div className="mb-4 flex gap-2 overflow-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'versions', label: 'Version History' },
          { id: 'linked', label: 'Linked Records' },
          { id: 'audit', label: 'Audit Trail' },
        ].map((tabItem) => <Button key={tabItem.id} variant={tab === tabItem.id ? 'primary' : 'secondary'} onClick={() => setTab(tabItem.id)}>{tabItem.label}</Button>)}
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-maroon-700 hover:text-maroon-800" to={`/search?focus=document:${doc.id}`}>Relationships</Link>
      </div>
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-bold">Document Overview</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted">Category</dt><dd className="font-semibold">{doc.category}</dd></div>
              <div><dt className="text-sm text-muted">Status</dt><dd><StatusBadge status={doc.status} /></dd></div>
              <div><dt className="text-sm text-muted">Classification</dt><dd className="font-semibold">{doc.classification}</dd></div>
              <div><dt className="text-sm text-muted">Current version</dt><dd className="font-semibold">v{doc.currentVersion}</dd></div>
              <div><dt className="text-sm text-muted">Uploaded by</dt><dd>{uploader}</dd></div>
              <div><dt className="text-sm text-muted">Upload date</dt><dd>{formatDate(doc.uploadDate)}</dd></div>
            </dl>
            {doc.sourceUrl && <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-maroon-800 hover:border-maroon-700"><LinkIcon className="h-4 w-4" /> Open source link</a>}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Primary Links</h2>
            <div className="space-y-4">
              <div><p className="mb-1 text-sm text-muted">Entity</p><EntityBadge id={doc.entityId} /></div>
              <div><p className="mb-1 text-sm text-muted">Case</p>{doc.caseId ? <RecordLink to={`/cases/${doc.caseId}`} tone="blue">Open case</RecordLink> : <span className="text-muted">No linked case</span>}</div>
              <div><p className="mb-1 text-sm text-muted">Related cases</p><RelatedCaseLinks ids={doc.relatedCaseIds} cases={cases} /></div>
            </div>
          </Card>
        </div>
      )}
      {tab === 'versions' && (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Version History</h2>
          <Table><thead><tr><Th>Version</Th><Th>File</Th><Th>Updated By</Th><Th>Date</Th><Th>Note</Th></tr></thead><tbody>{doc.versions.map((version) => <tr key={version.version}><Td>v{version.version}</Td><Td>{version.fileName}</Td><Td>{version.updatedBy}</Td><Td>{formatDate(version.updatedAt)}</Td><Td>{version.note}</Td></tr>)}</tbody></Table>
          <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (fileName.trim()) addVersion.mutate({ id: doc.id, version: { fileName, updatedBy: '', note: 'New version uploaded' } }); setFileName(''); }}>
            <Input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="new-version.pdf" />
            <Button>Add Version</Button>
          </form>
        </Card>
      )}
      {tab === 'linked' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Linked Case & Entity</h2><div className="space-y-4"><div><p className="mb-1 text-sm text-muted">Entity</p><EntityBadge id={doc.entityId} /></div><div><p className="mb-1 text-sm text-muted">Primary case</p>{doc.caseId ? <RecordLink to={`/cases/${doc.caseId}`} tone="blue">Open case</RecordLink> : <span className="text-muted">No linked case</span>}</div><div><p className="mb-1 text-sm text-muted">Related cases</p><RelatedCaseLinks ids={doc.relatedCaseIds} cases={cases} /></div></div></Card>
          <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Related Correspondence</h2><LinkedCorrespondence items={linkedCorrespondence} /></Card>
        </div>
      )}
      {tab === 'audit' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Audit Trail</h2>
          {documentAudit.length === 0 ? <EmptyState title="No audit entries yet" body="Uploads, downloads, and document updates will appear here." /> : <Table><thead><tr><Th>Date</Th><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Record</Th></tr></thead><tbody>{documentAudit.map((entry) => <tr key={entry.id}><Td>{formatDate(entry.date)}</Td><Td>{entry.user}</Td><Td>{entry.action}</Td><Td>{entry.module}</Td><Td>{entry.recordRef}</Td></tr>)}</tbody></Table>}
        </Card>
      )}
      <DocumentEditForm item={doc} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

function CorrespondenceAssigneePicker({ assignees, onChange }: { assignees: string[]; onChange: (v: string[]) => void }) {
  const { users } = useSession();
  const officerUsers = users.filter((u) => u.role.includes('Legal') || u.role === 'General Counsel' || u.role === 'Executive Officer' || u.role === 'CEO');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const filtered = officerUsers.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()),
  );
  function toggle(name: string) {
    onChange(assignees.includes(name) ? assignees.filter((a) => a !== name) : [...assignees, name]);
  }
  return (
    <div className="space-y-2">
      {assignees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assignees.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 pl-3 pr-2 py-1 text-xs font-semibold text-white">
              {name}
              <button type="button" onClick={() => toggle(name)} className="flex items-center justify-center rounded-full hover:opacity-75"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => { setDropdownOpen((v) => !v); setSearch(''); }}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-3 text-sm text-muted hover:border-maroon-700 focus:outline-none"
        >
          <span>{assignees.length > 0 ? `${assignees.length} selected` : 'Search officers...'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {dropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-line bg-white shadow-lg">
            <div className="border-b border-line p-2">
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="w-full rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-maroon-700" />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted">No staff found.</div>
              ) : (
                filtered.map((u) => {
                  const isSelected = assignees.includes(u.name);
                  return (
                    <button key={u.id} type="button" onClick={() => toggle(u.name)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-maroon-100/50">
                      <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', isSelected ? 'border-maroon-700 bg-maroon-700' : 'border-line bg-white')}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium text-ink">{u.name}</div>
                        <div className="text-xs text-muted">{u.role}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CorrespondenceForm({ open, onClose, lockedCase }: { open: boolean; onClose: () => void; lockedCase?: Case }) {
  const { data: entities = [] } = useEntities();
  const { data: cases = [] } = useCases();
  const { createCorrespondence } = useCorrespondenceMutations();
  const [assignees, setAssignees] = useState<string[]>([]);
  useEffect(() => { if (open) setAssignees([]); }, [open]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: CorrespondenceInput = {
      subject: String(form.get('subject')),
      direction: String(form.get('direction')) as CorrespondenceInput['direction'],
      date: String(form.get('date')),
      sender: String(form.get('sender')),
      recipient: String(form.get('recipient')),
      category: String(form.get('category')) as CorrespondenceInput['category'],
      priority: String(form.get('priority')) as CorrespondenceInput['priority'],
      confidentiality: String(form.get('confidentiality')) as CorrespondenceInput['confidentiality'],
      assignedTo: assignees,
      actionRequired: String(form.get('actionRequired')) as CorrespondenceInput['actionRequired'],
      dueDate: String(form.get('dueDate')) || null,
      responseReference: String(form.get('responseReference')) || null,
      entityId: String(form.get('entityId')) || null,
      caseId: lockedCase ? lockedCase.id : String(form.get('caseId')) || null,
      attachments: [],
      status: String(form.get('status')) as CorrespondenceInput['status'],
      closedDate: null,
    };
    await createCorrespondence.mutateAsync(input);
    onClose();
  }
  return (
    <Modal title="New CEO Correspondence" open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {lockedCase && <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Linked to case: {lockedCase.caseNumber} · {lockedCase.caseTitle} (fixed)</div>}
        <label className="space-y-1"><span className="text-sm font-semibold">Direction</span><Select name="direction"><option>Incoming</option><option>Outgoing</option></Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Date</span><Input type="date" name="date" defaultValue={today()} /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Subject</span><Input name="subject" required /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Sender</span><Input name="sender" required /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Recipient</span><Input name="recipient" required /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Category</span><Select name="category">{CORRESPONDENCE_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Priority</span><Select name="priority" defaultValue="Medium">{CORRESPONDENCE_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Confidentiality</span><Select name="confidentiality" defaultValue="Internal">{CORRESPONDENCE_CONFIDENTIALITY.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Action Required</span><Select name="actionRequired">{CORRESPONDENCE_ACTIONS.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <div className="space-y-1 md:col-span-2">
          <span className="text-sm font-semibold">Assigned To</span>
          <CorrespondenceAssigneePicker assignees={assignees} onChange={setAssignees} />
        </div>
        <label className="space-y-1"><span className="text-sm font-semibold">Due Date</span><Input type="date" name="dueDate" /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId"><option value="">No entity</option>{entities.map((entity) => <option value={entity.entityId} key={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        {!lockedCase && <label className="space-y-1"><span className="text-sm font-semibold">Case</span><Select name="caseId"><option value="">No case</option>{cases.map((item) => <option value={item.id} key={item.id}>{item.caseNumber}</option>)}</Select></label>}
        <label className="space-y-1"><span className="text-sm font-semibold">Response Reference</span><Input name="responseReference" placeholder="Linked response doc/letter (optional)" /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="status">{CORRESPONDENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button>Register</Button></div>
      </form>
    </Modal>
  );
}

function CorrespondenceEditForm({ item, open, onClose }: { item: Correspondence; open: boolean; onClose: () => void }) {
  const { data: entities = [] } = useEntities();
  const { data: cases = [] } = useCases();
  const { updateCorrespondence } = useCorrespondenceMutations();
  const [status, setStatus] = useState(item.status);
  const [assignees, setAssignees] = useState<string[]>(item.assignedTo);
  useEffect(() => {
    if (open) { setStatus(item.status); setAssignees(item.assignedTo); }
  }, [open, item.status, item.assignedTo]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextStatus = String(form.get('status')) as CorrespondenceInput['status'];
    const patch: Partial<CorrespondenceInput> = {
      subject: String(form.get('subject')),
      direction: String(form.get('direction')) as CorrespondenceInput['direction'],
      date: String(form.get('date')),
      sender: String(form.get('sender')),
      recipient: String(form.get('recipient')),
      category: String(form.get('category')) as CorrespondenceInput['category'],
      priority: String(form.get('priority')) as CorrespondenceInput['priority'],
      confidentiality: String(form.get('confidentiality')) as CorrespondenceInput['confidentiality'],
      assignedTo: assignees,
      actionRequired: String(form.get('actionRequired')) as CorrespondenceInput['actionRequired'],
      dueDate: String(form.get('dueDate')) || null,
      responseReference: String(form.get('responseReference')) || null,
      entityId: String(form.get('entityId')) || null,
      caseId: String(form.get('caseId')) || null,
      status: nextStatus,
      closedDate: nextStatus === 'Closed' ? (item.closedDate ?? today()) : null,
    };
    await updateCorrespondence.mutateAsync({ id: item.id, patch });
    onClose();
  }
  return (
    <Modal title={`Edit Correspondence - ${item.correspondenceNumber}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Correspondence number: {item.correspondenceNumber} (fixed)</div>
        <label className="space-y-1"><span className="text-sm font-semibold">Direction</span><Select name="direction" defaultValue={item.direction}><option>Incoming</option><option>Outgoing</option></Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Date</span><Input type="date" name="date" defaultValue={item.date} required /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Subject</span><Input name="subject" required minLength={3} defaultValue={item.subject} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Sender</span><Input name="sender" required defaultValue={item.sender} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Recipient</span><Input name="recipient" required defaultValue={item.recipient} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Category</span><Select name="category" defaultValue={item.category}>{CORRESPONDENCE_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Priority</span><Select name="priority" defaultValue={item.priority}>{CORRESPONDENCE_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Confidentiality</span><Select name="confidentiality" defaultValue={item.confidentiality}>{CORRESPONDENCE_CONFIDENTIALITY.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Action Required</span><Select name="actionRequired" defaultValue={item.actionRequired}>{CORRESPONDENCE_ACTIONS.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <div className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Assigned To</span><CorrespondenceAssigneePicker assignees={assignees} onChange={setAssignees} /></div>
        <label className="space-y-1"><span className="text-sm font-semibold">Due Date</span><Input type="date" name="dueDate" defaultValue={item.dueDate ?? ''} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity</span><Select name="entityId" defaultValue={item.entityId ?? ''}><option value="">No entity</option>{entities.map((entity) => <option value={entity.entityId} key={entity.entityId}>{entity.entityName}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Case</span><Select name="caseId" defaultValue={item.caseId ?? ''}><option value="">No case</option>{cases.map((caseItem) => <option value={caseItem.id} key={caseItem.id}>{caseItem.caseNumber}</option>)}</Select></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Response Reference</span><Input name="responseReference" defaultValue={item.responseReference ?? ''} placeholder="Linked response doc/letter (optional)" /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="status" value={status} onChange={(event) => setStatus(event.target.value as Correspondence['status'])}>{CORRESPONDENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</Select></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={updateCorrespondence.isPending}>Save changes</Button></div>
      </form>
    </Modal>
  );
}

type CorrespondenceListFilters = { query: string; direction: string; status: string; category: string; priority: string; dateFrom: string; dateTo: string; sortBy: string };
const emptyCorrespondenceFilters: CorrespondenceListFilters = { query: '', direction: '', status: '', category: '', priority: '', dateFrom: '', dateTo: '', sortBy: '' };

function CorrespondenceFilters({ filters, setFilters, resetFilters }: { filters: CorrespondenceListFilters; setFilters: React.Dispatch<React.SetStateAction<CorrespondenceListFilters>>; resetFilters: () => void }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilters = [
    filters.direction ? { key: 'direction', label: `Direction: ${filters.direction}`, clear: () => setFilters((value) => ({ ...value, direction: '' })) } : null,
    filters.status ? { key: 'status', label: `Status: ${filters.status}`, clear: () => setFilters((value) => ({ ...value, status: '' })) } : null,
    filters.category ? { key: 'category', label: `Category: ${filters.category}`, clear: () => setFilters((value) => ({ ...value, category: '' })) } : null,
    filters.priority ? { key: 'priority', label: `Priority: ${filters.priority}`, clear: () => setFilters((value) => ({ ...value, priority: '' })) } : null,
    filters.dateFrom ? { key: 'dateFrom', label: `From: ${formatDate(filters.dateFrom)}`, clear: () => setFilters((value) => ({ ...value, dateFrom: '' })) } : null,
    filters.dateTo ? { key: 'dateTo', label: `To: ${formatDate(filters.dateTo)}`, clear: () => setFilters((value) => ({ ...value, dateTo: '' })) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(22rem,1fr)_auto] xl:items-center">
        <Input className="xl:max-w-md" placeholder="Search correspondence..." value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap xl:justify-end">
          <div className="relative">
            <Button type="button" variant="secondary" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen} className="h-11">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-maroon-700 px-1.5 text-xs font-black text-white">{activeFilters.length}</span> : null}
            </Button>
            {filterOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[min(420px,calc(100vw-3rem))] rounded-lg border border-line bg-white p-4 shadow-lift">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">Correspondence filters</p>
                  <button type="button" onClick={() => setFilterOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-maroon-100 hover:text-maroon-900" aria-label="Close correspondence filters">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Direction</span>
                    <Select value={filters.direction} onChange={(event) => setFilters({ ...filters, direction: event.target.value })}><option value="">All directions</option><option>Incoming</option><option>Outgoing</option></Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Status</span>
                    <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{CORRESPONDENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Category</span>
                    <Select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{CORRESPONDENCE_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Priority</span>
                    <Select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{CORRESPONDENCE_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Dated from</span>
                    <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">Dated to</span>
                    <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
          <Select className="w-44" value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} aria-label="Sort correspondence">
            <option value="">Newest date</option>
            <option value="oldest">Oldest date</option>
            <option value="correspondenceNumber">Letter no.</option>
            <option value="status">Status</option>
          </Select>
          <Button variant="secondary" type="button" onClick={resetFilters}>Reset</Button>
        </div>
      </div>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((item) => (
            <button key={item.key} type="button" onClick={item.clear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-maroon-100 px-3 text-xs font-bold text-maroon-900 ring-1 ring-maroon-200 transition hover:bg-maroon-200">
              {item.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CorrespondencePage() {
  const [filters, setFilters] = useState<CorrespondenceListFilters>(emptyCorrespondenceFilters);
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useCorrespondence(filters);
  const { canDo } = usePermission();
  const resetFilters = () => setFilters(emptyCorrespondenceFilters);
  return <><PageHeader title="CEO Correspondence" description="Incoming and outgoing CEO legal correspondence with approvals, attachments, and links." action={canDo('registerCorrespondence') ? <Button onClick={() => setOpen(true)}><Send className="h-4 w-4" /> New Correspondence</Button> : null} /><CorrespondenceFilters filters={filters} setFilters={setFilters} resetFilters={resetFilters} /><LinkedCorrespondence items={items} /><CorrespondenceForm open={open} onClose={() => setOpen(false)} /></>;
}

function CorrespondenceDetailPage() {
  const { id } = useParams();
  const { data: item } = useCorrespondenceItem(id);
  const docs = useDocuments({ correspondenceId: id }).data ?? [];
  const { data: audit = [] } = useAudit();
  const { approveCorrespondence, updateCorrespondence } = useCorrespondenceMutations();
  const { canDo } = usePermission();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const backLink = useBackLink('/correspondence', 'Back to CEO Correspondence');
  if (!item) return <EmptyState title="Correspondence unavailable" body="This record does not exist." />;
  const correspondenceAudit = audit.filter((entry) => entry.recordRef === item.correspondenceNumber);
  return (
    <>
      <BackLink to={backLink.to}>{backLink.label}</BackLink>
      <PageHeader
        title={`${item.correspondenceNumber} · ${item.subject}`}
        description={`${item.direction} correspondence from ${item.sender} to ${item.recipient}`}
        action={<div className="flex shrink-0 flex-nowrap items-center gap-2">{canDo('registerCorrespondence') && <Button variant="secondary" className="w-44" onClick={() => setEditOpen(true)}>Edit Correspondence</Button>}{canDo('approveCorrespondence') && !item.approvedAt && <Button onClick={() => approveCorrespondence.mutate(item.id)}><ShieldCheck className="h-4 w-4" /> Approve</Button>}<Select value={item.status} onChange={(event) => updateCorrespondence.mutate({ id: item.id, patch: { status: event.target.value as CorrespondenceInput['status'] } })}>{CORRESPONDENCE_STATUSES.map((value) => <option key={value}>{value}</option>)}</Select></div>}
      />
      <div className="mb-4 flex gap-2 overflow-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'attachments', label: 'Attachments' },
          { id: 'linked', label: 'Linked Records' },
          { id: 'audit', label: 'Audit Trail' },
        ].map((tabItem) => <Button key={tabItem.id} variant={tab === tabItem.id ? 'primary' : 'secondary'} onClick={() => setTab(tabItem.id)}>{tabItem.label}</Button>)}
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-maroon-700 hover:text-maroon-800" to={`/search?focus=correspondence:${item.id}`}>Relationships</Link>
      </div>
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-bold">Correspondence Overview</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted">Direction</dt><dd className="font-semibold">{item.direction}</dd></div>
              <div><dt className="text-sm text-muted">Status</dt><dd><StatusBadge status={item.status} /></dd></div>
              <div><dt className="text-sm text-muted">Category</dt><dd className="font-semibold">{item.category}</dd></div>
              <div><dt className="text-sm text-muted">Priority</dt><dd><PriorityBadge priority={item.priority} /></dd></div>
              <div><dt className="text-sm text-muted">Confidentiality</dt><dd><ConfidentialityBadge level={item.confidentiality} /></dd></div>
              <div><dt className="text-sm text-muted">Action Required</dt><dd className="font-semibold">{item.actionRequired}</dd></div>
              <div><dt className="text-sm text-muted">Assigned To</dt><dd className="font-semibold">{item.assignedTo.join(', ')}</dd></div>
              <div><dt className="text-sm text-muted">Due Date</dt><dd>{item.dueDate ? formatDate(item.dueDate) : 'No due date'}</dd></div>
              <div><dt className="text-sm text-muted">Date</dt><dd>{formatDate(item.date)}</dd></div>
              <div><dt className="text-sm text-muted">Closed</dt><dd>{item.closedDate ? formatDate(item.closedDate) : 'Not closed'}</dd></div>
              <div><dt className="text-sm text-muted">Sender</dt><dd className="font-semibold">{item.sender}</dd></div>
              <div><dt className="text-sm text-muted">Recipient</dt><dd className="font-semibold">{item.recipient}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-muted">Response Reference</dt><dd className="font-semibold">{item.responseReference || 'None'}</dd></div>
            </dl>
            {item.approvedAt && <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm font-semibold text-success">Approved on {formatDate(item.approvedAt)}</p>}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Primary Links</h2>
            <div className="space-y-4">
              <div><p className="mb-1 text-sm text-muted">Entity</p><EntityBadge id={item.entityId} /></div>
              <div><p className="mb-1 text-sm text-muted">Case</p>{item.caseId ? <RecordLink to={`/cases/${item.caseId}`} tone="blue">Open case</RecordLink> : <span className="text-muted">No linked case</span>}</div>
            </div>
          </Card>
        </div>
      )}
      {tab === 'attachments' && <Card className="p-5"><h2 className="mb-3 text-lg font-bold">Attachments</h2><LinkedDocuments docs={docs} /></Card>}
      {tab === 'linked' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Linked Case & Entity</h2><div className="space-y-4"><div><p className="mb-1 text-sm text-muted">Entity</p><EntityBadge id={item.entityId} /></div><div><p className="mb-1 text-sm text-muted">Case</p>{item.caseId ? <RecordLink to={`/cases/${item.caseId}`} tone="blue">Open case</RecordLink> : <span className="text-muted">No linked case</span>}</div></div></Card>
          <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Attached Documents</h2><LinkedDocuments docs={docs} /></Card>
        </div>
      )}
      {tab === 'audit' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Audit Trail</h2>
          {correspondenceAudit.length === 0 ? <EmptyState title="No audit entries yet" body="Registrations, approvals, and status updates will appear here." /> : <Table><thead><tr><Th>Date</Th><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Record</Th></tr></thead><tbody>{correspondenceAudit.map((entry) => <tr key={entry.id}><Td>{formatDate(entry.date)}</Td><Td>{entry.user}</Td><Td>{entry.action}</Td><Td>{entry.module}</Td><Td>{entry.recordRef}</Td></tr>)}</tbody></Table>}
        </Card>
      )}
      <CorrespondenceEditForm item={item} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState('all');
  const { data: results = [] } = useSearch(query, kind);
  const entities = useEntities().data ?? [];
  const cases = useCases().data ?? [];
  const docs = useDocuments().data ?? [];
  const corr = useCorrespondence().data ?? [];
  const [focus, setFocus] = useState(params.get('focus') ?? (entities[0] ? `entity:${entities[0].entityId}` : ''));
  useEffect(() => {
    if (!focus && entities[0]) setFocus(`entity:${entities[0].entityId}`);
  }, [entities, focus]);
  useEffect(() => {
    const nextFocus = params.get('focus');
    if (nextFocus && nextFocus !== focus) setFocus(nextFocus);
  }, [params, focus]);
  const groups = ['entity', 'case', 'document', 'correspondence'].map((name) => ({ name, items: results.filter((item) => item.kind === name) }));
  return <><PageHeader title="Search & Relationships" description="Unified legal search plus the entity-centred relationship map." /><div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]"><Card className="p-5"><div className="mb-4 flex gap-2"><Input value={query} onChange={(event) => { setQuery(event.target.value); setParams({ q: event.target.value }); }} placeholder="Search by entity, case no, document, officer..." /><Select className="max-w-48" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">All</option><option value="entity">Entities</option><option value="case">Cases</option><option value="document">Documents</option><option value="correspondence">Correspondence</option></Select></div>{!query ? <EmptyState title="Enter a search term" body="Try Kumul, CASE-2026, DOC-2026, or correspondence subjects." /> : groups.map((group) => group.items.length ? <div key={group.name} className="mb-5"><h2 className="mb-2 text-sm font-bold uppercase text-muted">{group.name} ({group.items.length})</h2><div className="space-y-2">{group.items.map((result, index) => <button key={`${result.kind}-${index}`} onClick={() => setFocus(`${result.kind}:${searchResultId(result)}`)} className="w-full rounded-lg border border-line p-3 text-left hover:border-maroon-700"><div className="font-bold">{searchResultTitle(result)}</div><p className="text-sm text-muted">{result.context}</p></button>)}</div></div> : null)}</Card><Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Relationship Map</h2><Select value={focus} onChange={(event) => setFocus(event.target.value)} className="max-w-80"><optgroup label="Entities">{entities.map((entity) => <option key={entity.entityId} value={`entity:${entity.entityId}`}>{entity.entityName}</option>)}</optgroup><optgroup label="Cases">{cases.map((item) => <option key={item.id} value={`case:${item.id}`}>{item.caseNumber}</option>)}</optgroup><optgroup label="Documents">{docs.map((item) => <option key={item.id} value={`document:${item.id}`}>{item.documentNumber}</option>)}</optgroup><optgroup label="Correspondence">{corr.map((item) => <option key={item.id} value={`correspondence:${item.id}`}>{item.correspondenceNumber}</option>)}</optgroup></Select></div><RelationshipMap focus={focus} entities={entities} cases={cases} docs={docs} corr={corr} /></Card></div></>;
}

type RelationshipNodeType = 'entity' | 'case' | 'document' | 'correspondence';
type RelationshipNode = { id: string; type: RelationshipNodeType; label: string; summary: string; detail: string; to: string; relation?: 'primary' | 'related' };

function RelationshipMap({ focus, entities, cases, docs, corr }: { focus: string; entities: Entity[]; cases: Case[]; docs: LegalDocument[]; corr: Correspondence[] }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<(RelationshipNode & { x: number; y: number }) | null>(null);
  const [kind, id] = focus.split(':') as [RelationshipNodeType | undefined, string | undefined];
  const entityNode = (item: Entity): RelationshipNode => ({ id: item.entityId, type: 'entity', label: item.entityId, summary: item.entityName, detail: item.registrationDetails, to: `/search?focus=entity:${item.entityId}` });
  const caseNode = (item: Case, relation?: 'primary' | 'related'): RelationshipNode => ({ id: item.id, type: 'case', label: item.caseNumber, summary: item.caseTitle, detail: `${item.status} matter registered ${formatDate(item.dateOpened)}${relation === 'related' ? ' (related case)' : ''}`, to: `/cases/${item.id}`, relation });
  const documentNode = (item: LegalDocument, relation?: 'primary' | 'related'): RelationshipNode => ({ id: item.id, type: 'document', label: item.documentNumber, summary: item.title, detail: `${item.category} | ${item.status}${relation === 'related' ? ' (related case)' : ''}`, to: `/documents/${item.id}`, relation });
  const correspondenceNode = (item: Correspondence): RelationshipNode => ({ id: item.id, type: 'correspondence', label: item.correspondenceNumber, summary: item.subject, detail: `${item.direction} | ${item.status} | ${formatDate(item.date)}`, to: `/correspondence/${item.id}` });
  const focalNode = kind === 'entity'
    ? entities.find((item) => item.entityId === id)
    : kind === 'case'
      ? cases.find((item) => item.id === id)
      : kind === 'document'
        ? docs.find((item) => item.id === id)
        : kind === 'correspondence'
          ? corr.find((item) => item.id === id)
          : null;
  const activeNode = focalNode ? (kind === 'entity' ? entityNode(focalNode as Entity) : kind === 'case' ? caseNode(focalNode as Case) : kind === 'document' ? documentNode(focalNode as LegalDocument) : correspondenceNode(focalNode as Correspondence)) : null;
  const related = useMemo(() => {
    if (kind === 'entity') return [...cases.filter((item) => item.entityId === id).map((item) => caseNode(item)), ...docs.filter((item) => item.entityId === id).map((item) => documentNode(item)), ...corr.filter((item) => item.entityId === id).map((item) => correspondenceNode(item))];
    if (kind === 'case') {
      const caseItem = cases.find((item) => item.id === id);
      return [
        ...(caseItem?.entityId ? entities.filter((entity) => entity.entityId === caseItem.entityId).map((entity) => entityNode(entity)) : []),
        ...docs.filter((item) => item.caseId === id).map((item) => documentNode(item, 'primary')),
        ...docs.filter((item) => item.caseId !== id && item.relatedCaseIds?.includes(id ?? '')).map((item) => documentNode(item, 'related')),
        ...corr.filter((item) => item.caseId === id).map((item) => correspondenceNode(item)),
      ];
    }
    if (kind === 'document') {
      const doc = docs.find((item) => item.id === id);
      if (!doc) return [];
      return [
        ...(doc.entityId ? entities.filter((item) => item.entityId === doc.entityId).map((item) => entityNode(item)) : []),
        ...(doc.caseId ? cases.filter((item) => item.id === doc.caseId).map((item) => caseNode(item, 'primary')) : []),
        ...cases.filter((item) => doc.relatedCaseIds?.includes(item.id)).map((item) => caseNode(item, 'related')),
        ...corr.filter((item) => item.id === doc.correspondenceId || (doc.caseId && item.caseId === doc.caseId)).map((item) => correspondenceNode(item)),
      ];
    }
    if (kind === 'correspondence') {
      const item = corr.find((candidate) => candidate.id === id);
      if (!item) return [];
      return [
        ...(item.entityId ? entities.filter((entity) => entity.entityId === item.entityId).map((entity) => entityNode(entity)) : []),
        ...(item.caseId ? cases.filter((caseItem) => caseItem.id === item.caseId).map((caseItem) => caseNode(caseItem)) : []),
        ...docs.filter((doc) => doc.correspondenceId === item.id || (item.caseId && doc.caseId === item.caseId)).map((doc) => documentNode(doc)),
      ];
    }
    return [];
  }, [kind, id, entities, cases, docs, corr]);
  const center = { x: 300, y: 220 };
  const nodeStyle: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };
  const nodeFill = (type: RelationshipNodeType) => type === 'entity' ? '#98002E' : type === 'case' ? '#2563A8' : type === 'document' ? '#6D54B5' : '#D9682A';
  const openNode = (node: RelationshipNode) => navigate(node.to, {
    state: {
      backTo: `/search?focus=${focus}`,
      backLabel: 'Back to Relationships',
    },
  });
  const renderNode = (node: RelationshipNode, x: number, y: number, radius: number, label: string, detailLabel?: string) => (
    <g
      key={`${node.type}-${node.id}`}
      role="link"
      tabIndex={0}
      aria-label={`Open ${node.summary}`}
      className="group cursor-pointer outline-none"
      style={nodeStyle}
      transform={`translate(${x} ${y})`}
      onMouseEnter={() => setHovered({ ...node, x, y })}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered({ ...node, x, y })}
      onBlur={() => setHovered(null)}
      onClick={() => openNode(node)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openNode(node);
        }
      }}
    >
      <circle r={radius + 14} fill="transparent" />
      <circle r={radius + 8} fill={nodeFill(node.type)} opacity="0" className="transition-opacity duration-200 group-hover:opacity-20 group-focus:opacity-20" />
      <circle r={radius} fill={nodeFill(node.type)} className="transition-opacity duration-200 group-hover:opacity-95 group-focus:opacity-95" />
      <circle r={radius + 2} fill="none" stroke="white" strokeOpacity="0" strokeWidth="3" className="transition-all duration-200 group-hover:stroke-opacity-80 group-focus:stroke-opacity-80" />
      <text y={detailLabel ? -3 : 4} textAnchor="middle" fill="white" fontWeight="800" fontSize={radius > 50 ? 14 : 11} className="pointer-events-none select-none">{label}</text>
      {detailLabel ? <text y={20} textAnchor="middle" fill="white" fontWeight="700" fontSize="11" className="pointer-events-none select-none">{detailLabel}</text> : null}
    </g>
  );

  return (
    <div className="relative h-[460px] rounded-lg border border-line bg-[#fffafa]">
      {hovered ? (
        <div
          className="pointer-events-none absolute z-20 w-64 rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-lift"
          style={{ left: `${(hovered.x / 600) * 100}%`, top: `${(hovered.y / 440) * 100}%`, transform: hovered.x > 455 ? 'translate(-100%, -115%)' : 'translate(-50%, -115%)' }}
        >
          <p className="font-black text-ink">{hovered.summary}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-maroon-800">{hovered.label}</p>
          <p className="mt-1 text-xs text-muted">{hovered.detail}</p>
        </div>
      ) : null}
      <svg viewBox="0 0 600 440" className="h-full w-full">
        {related.map((node, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(related.length, 1) - Math.PI / 2;
          const x = center.x + Math.cos(angle) * 190;
          const y = center.y + Math.sin(angle) * 150;
          return <line key={`line-${node.type}-${node.id}`} x1={center.x} y1={center.y} x2={x} y2={y} stroke={node.relation === 'related' ? '#C8A6B6' : '#C8B6BE'} strokeWidth="2" strokeDasharray={node.relation === 'related' ? '2 4' : node.type === 'document' ? '5 5' : ''} />;
        })}
        {activeNode ? renderNode(activeNode, center.x, center.y, 62, compactNodeLabel(activeNode.label), activeNode.type) : null}
        {related.map((node, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(related.length, 1) - Math.PI / 2;
          const x = center.x + Math.cos(angle) * 190;
          const y = center.y + Math.sin(angle) * 150;
          return renderNode(node, x, y, 44, compactNodeLabel(node.label));
        })}
      </svg>
    </div>
  );
}

function compactNodeLabel(label?: string) {
  if (!label) return '';
  return label.replace('-2026-', '-');
}

function ReportsPage() {
  const { data: summary = {} } = useSummary();
  const cases = useCases().data ?? [];
  const docs = useDocuments().data ?? [];
  const corr = useCorrespondence().data ?? [];
  const audit = useAudit().data ?? [];
  const { can } = usePermission();
  const caseStatus = CASE_STATUSES.map((status) => ({ name: status, value: cases.filter((item) => item.status === status).length })).filter((item) => item.value);
  const docCategory = DOCUMENT_CATEGORIES.map((category) => ({ name: category.replace(' Documents', ''), value: docs.filter((item) => item.category === category).length })).filter((item) => item.value);
  const caseTotal = caseStatus.reduce((total, item) => total + item.value, 0);
  return (
    <>
      <PageHeader
        title="Reports"
        description={can('viewReports') === 'limited' ? 'Limited report view for the current role.' : 'Executive, case, document, correspondence, user activity, and audit reports.'}
        action={<Button variant="secondary" onClick={() => csvDownload('audit.csv', audit.map((entry) => ({ date: entry.date, user: entry.user, action: entry.action, module: entry.module, recordRef: entry.recordRef })))}>Export Audit CSV</Button>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(summary).slice(0, 4).map(([key, value]) => (
          <Card key={key} className="p-5">
            <p className="text-sm font-semibold capitalize text-muted">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="tnum mt-3 text-3xl font-black text-maroon-800">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold">Cases by Status</h2>
          <p className="text-sm text-muted">Round status view of legal matters</p>
          <UniformDonutChart data={caseStatus} colors={statusChartColors} centerValue={caseTotal} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Documents by Category</h2>
          <div className="h-72">
            <UniformBarChart data={docCategory} colors={documentChartColors} hideXAxis />
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Outstanding Correspondence</h2><LinkedCorrespondence items={corr.filter((item) => item.status === 'Awaiting Response')} /></Card>
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Audit Trail</h2><Table><thead><tr><Th>Date</Th><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Record</Th></tr></thead><tbody>{audit.slice(0, 8).map((entry) => <tr key={entry.id}><Td>{formatDate(entry.date)}</Td><Td>{entry.user}</Td><Td>{entry.action}</Td><Td>{entry.module}</Td><Td>{entry.recordRef}</Td></tr>)}</tbody></Table></Card>
      </div>
    </>
  );
}

function entityStatusTone(status: Entity['entityStatus']) {
  if (status === 'Registered') return 'green';
  if (status === 'Revoked') return 'red';
  return 'amber';
}

function EntityForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createEntity } = useEntityMutations();
  const navigate = useNavigate();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: EntityInput = {
      entityName: String(form.get('entityName')),
      entityType: String(form.get('entityType')) as EntityInput['entityType'],
      entityStatus: 'Pending',
      registrationDetails: String(form.get('registrationDetails')),
      licenseNumber: String(form.get('licenseNumber') ?? '') || undefined,
      registrationDate: String(form.get('registrationDate') ?? '') || undefined,
      source: 'Manual',
    };
    const created = await createEntity.mutateAsync(input);
    onClose();
    navigate(`/entities/${created.entityId}`);
  }
  return (
    <Modal title="New Entity (Provisional)" open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dashed border-line bg-amber-50 px-3 py-2 text-sm font-semibold text-warning md:col-span-2">
          This creates a provisional entity inside LMS, flagged Pending until reconciled with the Licensing system. Prefer linking an existing entity wherever possible — this is not a registration action.
        </div>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Entity name</span><Input name="entityName" required minLength={3} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity type</span><Select name="entityType" defaultValue="Other">{ENTITY_TYPES.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Licence number</span><Input name="licenseNumber" placeholder="Optional" /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Registration date</span><Input type="date" name="registrationDate" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Registration details</span><Textarea name="registrationDetails" required /></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={createEntity.isPending}>Create Provisional Entity</Button></div>
      </form>
    </Modal>
  );
}

function EntityEditForm({ item, open, onClose }: { item: Entity; open: boolean; onClose: () => void }) {
  const { updateEntity } = useEntityMutations();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const patch: Partial<EntityInput> = {
      entityName: String(form.get('entityName')),
      entityType: String(form.get('entityType')) as EntityInput['entityType'],
      entityStatus: String(form.get('entityStatus')) as EntityInput['entityStatus'],
      registrationDetails: String(form.get('registrationDetails')),
      licenseNumber: String(form.get('licenseNumber') ?? '') || undefined,
      registrationDate: String(form.get('registrationDate') ?? '') || undefined,
    };
    await updateEntity.mutateAsync({ id: item.entityId, patch });
    onClose();
  }
  return (
    <Modal title={`Edit Entity - ${item.entityId}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {item.source !== 'Manual' && <div className="rounded-lg border border-dashed border-line bg-maroon-100/40 px-3 py-2 text-sm font-semibold text-muted md:col-span-2">Sourced from {item.source}. Local edits here may be overwritten by the next sync from the Licensing system.</div>}
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Entity name</span><Input name="entityName" required minLength={3} defaultValue={item.entityName} /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Entity type</span><Select name="entityType" defaultValue={item.entityType}>{ENTITY_TYPES.map((type) => <option key={type}>{type}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Status</span><Select name="entityStatus" defaultValue={item.entityStatus}>{ENTITY_STATUSES.map((status) => <option key={status}>{status}</option>)}</Select></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Licence number</span><Input name="licenseNumber" defaultValue={item.licenseNumber} placeholder="Optional" /></label>
        <label className="space-y-1"><span className="text-sm font-semibold">Registration date</span><Input type="date" name="registrationDate" defaultValue={item.registrationDate} /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold">Registration details</span><Textarea name="registrationDetails" required defaultValue={item.registrationDetails} /></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={updateEntity.isPending}>Save changes</Button></div>
      </form>
    </Modal>
  );
}

const emptyEntityFilters: EntityFilter = { query: '', status: '', type: '', source: '' };

function EntitiesPage() {
  const [filters, setFilters] = useState<EntityFilter>(emptyEntityFilters);
  const [open, setOpen] = useState(false);
  const { data: entities = [], isLoading } = useEntities(filters);
  const { canDo } = usePermission();
  const canCreate = canDo('manageEntities');
  return (
    <>
      <PageHeader
        title="Entities"
        description="Capital-market entities mirrored from the Licensing system. Cases, documents, and correspondence reference this register by entity ID."
        action={canCreate ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Entity</Button> : <Badge tone="muted">Entity management restricted</Badge>}
      />
      <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(22rem,1fr)_auto] xl:items-center">
        <Input className="xl:max-w-md" placeholder="Search entities..." value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap xl:justify-end">
          <Select className="w-48" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} aria-label="Filter by status"><option value="">All statuses</option>{ENTITY_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select>
          <Select className="w-48" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} aria-label="Filter by type"><option value="">All types</option>{ENTITY_TYPES.map((item) => <option key={item}>{item}</option>)}</Select>
          <Button variant="secondary" type="button" onClick={() => setFilters(emptyEntityFilters)}>Reset</Button>
        </div>
      </div>
      {isLoading ? <EmptyState title="Loading entities" body="Fetching the entity register." /> : entities.length === 0 ? <EmptyState title="No entities match these filters" body="Adjust filters or search by name, ID, or licence number." /> : (
        <Table><thead><tr><Th>Entity ID</Th><Th>Name</Th><Th>Type</Th><Th>Status</Th><Th>Licence No</Th><Th>Source</Th></tr></thead><tbody>
          {entities.map((item) => (
            <tr key={item.entityId} className="hover:bg-maroon-100/30">
              <Td><RecordLink to={`/entities/${item.entityId}`} tone="green">{item.entityId}</RecordLink></Td>
              <Td className="font-bold">{item.entityName}</Td>
              <Td>{item.entityType}</Td>
              <Td><Badge tone={entityStatusTone(item.entityStatus)}>{item.entityStatus}</Badge></Td>
              <Td>{item.licenseNumber ?? '—'}</Td>
              <Td><Badge tone={item.source === 'Manual' ? 'amber' : 'muted'}>{item.source}</Badge></Td>
            </tr>
          ))}
        </tbody></Table>
      )}
      <EntityForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function EntityDetailPage() {
  const { id } = useParams();
  const { data: item, isLoading } = useEntity(id);
  const { data: cases = [] } = useCases({ entityId: id });
  const { data: docs = [] } = useDocuments({ entityId: id });
  const { data: corr = [] } = useCorrespondence({ entityId: id });
  const { canDo } = usePermission();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const backLink = useBackLink('/entities', 'Back to Entities');
  if (isLoading) return <EmptyState title="Loading entity" body="Resolving entity details." />;
  if (!item) return <EmptyState title="Entity not found" body="This entity no longer exists in the register." />;
  return (
    <>
      <BackLink to={backLink.to}>{backLink.label}</BackLink>
      <PageHeader
        title={`${item.entityId} · ${item.entityName}`}
        description={item.registrationDetails}
        action={
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
            <Badge tone={entityStatusTone(item.entityStatus)}>{item.entityStatus}</Badge>
            {item.source === 'Manual' && <Badge tone="amber">Provisional</Badge>}
            {canDo('manageEntities') && <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit Entity</Button>}
          </div>
        }
      />
      <div className="mb-4 flex gap-2 overflow-auto">
        {[{ id: 'overview', label: 'Overview' }, { id: 'cases', label: `Cases (${cases.length})` }, { id: 'documents', label: `Documents (${docs.length})` }, { id: 'correspondence', label: `Correspondence (${corr.length})` }].map((tabItem) => (
          <Button key={tabItem.id} variant={tab === tabItem.id ? 'primary' : 'secondary'} onClick={() => setTab(tabItem.id)}>{tabItem.label}</Button>
        ))}
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-maroon-700 hover:text-maroon-800" to={`/search?focus=entity:${item.entityId}`}>Relationships</Link>
      </div>
      {tab === 'overview' && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Registration Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted">Entity type</dt><dd className="font-semibold">{item.entityType}</dd></div>
            <div><dt className="text-sm text-muted">Licence number</dt><dd className="font-semibold">{item.licenseNumber ?? 'Not recorded'}</dd></div>
            <div><dt className="text-sm text-muted">Registration date</dt><dd>{item.registrationDate ? formatDate(item.registrationDate) : 'Not recorded'}</dd></div>
            <div><dt className="text-sm text-muted">Source</dt><dd><Badge tone={item.source === 'Manual' ? 'amber' : 'muted'}>{item.source}</Badge></dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted">{item.registrationDetails}</p>
        </Card>
      )}
      {tab === 'cases' && (cases.length === 0 ? <EmptyState title="No linked cases" body="Cases registered against this entity will appear here." /> : (
        <Table><thead><tr><Th>Case No</Th><Th>Title</Th><Th>Type</Th><Th>Status</Th><Th>Registered</Th></tr></thead><tbody>
          {cases.map((caseItem) => (
            <tr key={caseItem.id}>
              <Td><RecordLink to={`/cases/${caseItem.id}`} tone="blue">{caseItem.caseNumber}</RecordLink></Td>
              <Td className="font-bold">{caseItem.caseTitle}{caseItem.isConfidential && <span className="ml-2"><ConfidentialBadge /></span>}</Td>
              <Td>{caseItem.caseType}</Td>
              <Td><StatusBadge status={caseItem.status} /></Td>
              <Td>{formatDate(caseItem.dateOpened)}</Td>
            </tr>
          ))}
        </tbody></Table>
      ))}
      {tab === 'documents' && <LinkedDocuments docs={docs} />}
      {tab === 'correspondence' && <LinkedCorrespondence items={corr} />}
      <EntityEditForm item={item} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

function RbacPage() {
  const { currentUser } = useSession();
  return <><PageHeader title="RBAC Self-Test" description={`Resolved permission matrix for ${currentUser.name} (${currentUser.role}).`} /><Table><thead><tr><Th>Action</Th><Th>Access</Th></tr></thead><tbody>{Object.keys(PERMISSIONS).map((action) => <tr key={action}><Td>{actionLabels[action as Action]}</Td><Td><Badge tone={PERMISSIONS[action as Action][currentUser.role] === 'none' ? 'red' : PERMISSIONS[action as Action][currentUser.role] === 'limited' ? 'amber' : PERMISSIONS[action as Action][currentUser.role] === 'assigned' ? 'purple' : 'green'}>{PERMISSIONS[action as Action][currentUser.role]}</Badge></Td></tr>)}</tbody></Table></>;
}

function NotFound() {
  return <EmptyState title="Page not found" body="Choose a module from the sidebar." />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route path="entities" element={<EntitiesPage />} />
        <Route path="entities/:id" element={<EntityDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="correspondence" element={<CorrespondencePage />} />
        <Route path="correspondence/:id" element={<CorrespondenceDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="rbac" element={<RbacPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
