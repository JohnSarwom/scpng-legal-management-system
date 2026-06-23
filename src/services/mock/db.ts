import { nanoid } from 'nanoid';
import type { Activity, AuditLog, Case, Correspondence, Entity, LegalDocument, Note, User } from '@/types';
import { now } from '@/lib/utils';

export const users: User[] = [
  { id: 'u-ceo', name: 'James Joshua', role: 'CEO' },
  { id: 'u-gc', name: 'Andy Ambulu', role: 'General Counsel' },
  { id: 'u-lm', name: 'Tyson Yapao', role: 'Legal Manager' },
  { id: 'u-sr', name: 'Isaac Mel', role: 'Senior Legal Officer' },
  { id: 'u-lo1', name: 'Immanuel Minoga', role: 'Legal Officer' },
  { id: 'u-lo2', name: 'Tony Kawas', role: 'Senior Legal Officer' },
  { id: 'u-eo', name: 'Ninipe Gurumo', role: 'Executive Officer' },
  { id: 'u-lo3', name: 'Johnson Tengere', role: 'Legal Officer' },
];

export const db: {
  entities: Entity[];
  users: User[];
  cases: Case[];
  documents: LegalDocument[];
  correspondence: Correspondence[];
  notes: Note[];
  activities: Activity[];
  audit: AuditLog[];
  counters: { case: number; document: number; correspondence: number; entity: number };
} = {
  users,
  entities: [
    { entityId: 'ENT-001', entityName: 'Kumul Capital Markets Limited', entityStatus: 'Registered', entityType: 'Broker-Dealer', registrationDetails: 'Licensed broker-dealer, Port Moresby, renewed 2026.', licenseNumber: 'SCPNG-BD-001', registrationDate: '2021-02-10', source: 'Licensing' },
    { entityId: 'ENT-002', entityName: 'Pacific Balanced Fund Management', entityStatus: 'Registered', entityType: 'Fund Manager', registrationDetails: 'Fund manager operating domestic unit trust products.', licenseNumber: 'SCPNG-FM-002', registrationDate: '2020-07-22', source: 'Licensing' },
    { entityId: 'ENT-003', entityName: 'Sepik Securities Brokers', entityStatus: 'Suspended', entityType: 'Broker-Dealer', registrationDetails: 'Broker licence suspended pending compliance remediation.', licenseNumber: 'SCPNG-BD-003', registrationDate: '2019-11-05', source: 'Licensing' },
    { entityId: 'ENT-004', entityName: 'New Guinea Energy Holdings', entityStatus: 'Registered', entityType: 'Listed Issuer', registrationDetails: 'PNGX listed issuer, energy sector.', licenseNumber: 'SCPNG-LI-004', registrationDate: '2018-04-30', source: 'Licensing' },
    { entityId: 'ENT-005', entityName: 'Highlands Trustees & Custody', entityStatus: 'Pending', entityType: 'Trustee/Custodian', registrationDetails: 'Trustee application under regulatory review.', registrationDate: '2026-01-15', source: 'Licensing' },
    { entityId: 'ENT-006', entityName: 'Coral Sea Superannuation Nominees', entityStatus: 'Registered', entityType: 'Trustee/Custodian', registrationDetails: 'Licensed nominee and custodial services provider.', licenseNumber: 'SCPNG-TC-006', registrationDate: '2017-09-12', source: 'Licensing' },
    { entityId: 'ENT-007', entityName: 'Bougainville Resources Exchange', entityStatus: 'Registered', entityType: 'Market Participant', registrationDetails: 'Market participant with cross-border listing exposure.', licenseNumber: 'SCPNG-MP-007', registrationDate: '2022-03-18', source: 'Licensing' },
    { entityId: 'ENT-008', entityName: 'Motuan Asset Advisors', entityStatus: 'Registered', entityType: 'Investment Adviser', registrationDetails: 'Investment adviser licence, Port Moresby.', licenseNumber: 'SCPNG-IA-008', registrationDate: '2021-08-01', source: 'Licensing' },
    { entityId: 'ENT-009', entityName: 'PNG Infrastructure Notes PLC', entityStatus: 'Registered', entityType: 'Listed Issuer', registrationDetails: 'Debt issuer with gazettal requirements.', licenseNumber: 'SCPNG-LI-009', registrationDate: '2023-05-26', source: 'Licensing' },
    { entityId: 'ENT-010', entityName: 'Madang Growth Equities', entityStatus: 'Revoked', entityType: 'Fund Manager', registrationDetails: 'Licence revoked following enforcement decision.', licenseNumber: 'SCPNG-FM-010', registrationDate: '2016-12-09', source: 'Licensing' },
    { entityId: 'ENT-011', entityName: 'National Capital Custodians', entityStatus: 'Registered', entityType: 'Trustee/Custodian', registrationDetails: 'Custodian with institutional client base.', licenseNumber: 'SCPNG-TC-011', registrationDate: '2019-02-14', source: 'Licensing' },
    { entityId: 'ENT-012', entityName: 'Ramu Compliance Services', entityStatus: 'Registered', entityType: 'Other', registrationDetails: 'Compliance consulting firm for market participants.', licenseNumber: 'SCPNG-OT-012', registrationDate: '2020-10-03', source: 'Licensing' },
  ],
  cases: [
    { id: 'case-1', caseNumber: 'CASE-2026-001', caseTitle: 'Sepik Securities licence suspension appeal', entityId: 'ENT-003', caseType: 'Regulatory', description: 'Review of suspension appeal and remediation undertakings.', responsibleOfficerId: 'u-lm', status: 'Under Review', dateOpened: '2026-01-13', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-2', caseNumber: 'CASE-2026-002', caseTitle: 'Kumul Capital market manipulation inquiry', entityId: 'ENT-001', caseType: 'Compliance', description: 'Legal support for investigation into unusual trade activity.', responsibleOfficerId: 'u-gc', status: 'Open', dateOpened: '2026-02-04', dateClosed: null, isConfidential: true, confidentialClass: 'Regulatory Investigations', grantedUserIds: ['u-lm'], createdAt: now(), updatedAt: now() },
    { id: 'case-3', caseNumber: 'CASE-2026-003', caseTitle: 'Employment disciplinary review', entityId: 'ENT-012', caseType: 'Employment', description: 'Advice on staff disciplinary matter involving privileged records.', responsibleOfficerId: 'u-sr', status: 'Pending', dateOpened: '2026-02-18', dateClosed: null, isConfidential: true, confidentialClass: 'Employment Disciplinary Cases', createdAt: now(), updatedAt: now() },
    { id: 'case-4', caseNumber: 'CASE-2026-004', caseTitle: 'PNG Infrastructure Notes prospectus review', entityId: 'ENT-009', caseType: 'Contracts', description: 'Prospectus and note deed legal review.', responsibleOfficerId: 'u-lo1', status: 'Open', dateOpened: '2026-03-01', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-5', caseNumber: 'CASE-2026-005', caseTitle: 'Madang Growth revocation litigation', entityId: 'ENT-010', caseType: 'Litigation', description: 'Court challenge to licence revocation.', responsibleOfficerId: 'u-gc', status: 'Open', dateOpened: '2026-03-09', dateClosed: null, isConfidential: true, confidentialClass: 'Litigation Matters', createdAt: now(), updatedAt: now() },
    { id: 'case-6', caseNumber: 'CASE-2026-006', caseTitle: 'Bougainville Exchange listing rules advice', entityId: 'ENT-007', caseType: 'Regulatory', description: 'Advice on listing rule harmonisation.', responsibleOfficerId: 'u-lo2', status: 'Draft', dateOpened: '2026-03-22', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-7', caseNumber: 'CASE-2026-007', caseTitle: 'Pacific Balanced Fund deed amendment', entityId: 'ENT-002', caseType: 'Contracts', description: 'Review trust deed amendment and investor notices.', responsibleOfficerId: 'u-lo1', status: 'Closed', dateOpened: '2026-01-30', dateClosed: '2026-04-12', isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-8', caseNumber: 'CASE-2026-008', caseTitle: 'Board delegation instrument update', entityId: 'ENT-006', caseType: 'Other', description: 'Confidential advice on board delegation instrument.', responsibleOfficerId: 'u-lm', status: 'Pending', dateOpened: '2026-04-08', dateClosed: null, isConfidential: true, confidentialClass: 'Board Matters', createdAt: now(), updatedAt: now() },
    { id: 'case-9', caseNumber: 'CASE-2026-009', caseTitle: 'Motuan Asset adviser agreement', entityId: 'ENT-008', caseType: 'Contracts', description: 'Standard adviser agreement revision.', responsibleOfficerId: 'u-lo3', status: 'Open', dateOpened: '2026-04-21', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-10', caseNumber: 'CASE-2026-010', caseTitle: 'National Capital custody compliance notice', entityId: 'ENT-011', caseType: 'Compliance', description: 'Draft compliance notice and enforcement options.', responsibleOfficerId: 'u-sr', status: 'Under Review', dateOpened: '2026-05-03', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-11', caseNumber: 'CASE-2026-011', caseTitle: 'Highlands trustee application conditions', entityId: 'ENT-005', caseType: 'Regulatory', description: 'Licence condition drafting for trustee application.', responsibleOfficerId: 'u-lo2', status: 'Open', dateOpened: '2026-05-20', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
    { id: 'case-12', caseNumber: 'CASE-2026-012', caseTitle: 'New Guinea Energy continuous disclosure matter', entityId: 'ENT-004', caseType: 'Compliance', description: 'Continuous disclosure advice and CEO brief.', responsibleOfficerId: 'u-eo', status: 'Open', dateOpened: '2026-06-01', dateClosed: null, isConfidential: false, confidentialClass: null, createdAt: now(), updatedAt: now() },
  ],
  documents: [],
  correspondence: [],
  notes: [
    { id: 'note-1', caseId: 'case-1', body: 'Requested updated remediation schedule from licence holder.', createdBy: 'Tyson Yapao', createdAt: now() },
    { id: 'note-2', caseId: 'case-5', body: 'External counsel brief settled for filing timeline.', createdBy: 'Andy Ambulu', createdAt: now() },
  ],
  activities: [
    { id: 'act-1', caseId: 'case-1', type: 'Status Change', description: 'Case moved to Under Review.', createdBy: 'Tyson Yapao', createdAt: now() },
    { id: 'act-2', caseId: 'case-4', type: 'Document linked', description: 'Prospectus review memo linked.', createdBy: 'Immanuel Minoga', createdAt: now() },
  ],
  audit: [
    { id: nanoid(), user: 'System', date: now(), action: 'Create', module: 'System', recordRef: 'Seed data loaded' },
  ],
  counters: { case: 12, document: 28, correspondence: 9, entity: 12 },
};

const docSeed = [
  ['DOC-2026-001', 'Sepik Suspension Notice', 'Compliance Documents', 'ENT-003', 'case-1', null, 'Active', false, 'sepik-notice.pdf'],
  ['DOC-2026-002', 'Kumul Investigation Brief', 'Internal Memos', 'ENT-001', 'case-2', null, 'Active', true, 'kumul-brief.pdf'],
  ['DOC-2026-003', 'Employment Advice Draft', 'Legal Opinions', 'ENT-012', 'case-3', null, 'Draft', true, 'disciplinary-advice.docx'],
  ['DOC-2026-004', 'Prospectus Legal Review', 'Legal Opinions', 'ENT-009', 'case-4', null, 'Active', false, 'prospectus-review.docx'],
  ['DOC-2026-005', 'Court Originating Summons', 'Court Documents', 'ENT-010', 'case-5', null, 'Active', true, 'summons.pdf'],
  ['DOC-2026-006', 'Listing Rules Markup', 'Agreements', 'ENT-007', 'case-6', null, 'Draft', false, 'listing-rules.docx'],
  ['DOC-2026-007', 'Fund Deed Amendment', 'Contracts', 'ENT-002', 'case-7', null, 'Superseded', false, 'deed-amendment.pdf'],
  ['DOC-2026-008', 'Board Delegation Note', 'Internal Memos', 'ENT-006', 'case-8', null, 'Active', true, 'delegation-note.pdf'],
  ['DOC-2026-009', 'Adviser Agreement', 'Contracts', 'ENT-008', 'case-9', null, 'Active', false, 'adviser-agreement.pdf'],
  ['DOC-2026-010', 'Custody Compliance Notice', 'External Correspondence', 'ENT-011', 'case-10', null, 'Active', false, 'custody-notice.pdf'],
] as const;

db.documents = docSeed.map((row, index) => ({
  id: `doc-${index + 1}`,
  documentNumber: row[0],
  title: row[1],
  category: row[2] as LegalDocument['category'],
  currentVersion: index % 3 === 0 ? 2 : 1,
  versions: [
    { version: 1, fileName: row[8], updatedBy: users[index % users.length].name, updatedAt: `2026-${String((index % 6) + 1).padStart(2, '0')}-10`, note: 'Initial upload' },
    ...(index % 3 === 0 ? [{ version: 2, fileName: `v2-${row[8]}`, updatedBy: 'Andy Ambulu', updatedAt: '2026-06-11', note: 'Counsel revisions' }] : []),
  ],
  entityId: row[3],
  caseId: row[4],
  correspondenceId: row[5],
  uploadedBy: users[index % users.length].id,
  uploadDate: `2026-${String((index % 6) + 1).padStart(2, '0')}-10`,
  status: row[6] as LegalDocument['status'],
  isConfidential: row[7],
  classification: row[7] ? 'Confidential' : 'Restricted',
  expiryDate: row[2] === 'Contracts' ? '2026-09-30' : undefined,
}));

const relatedCaseLinks: Record<string, string[]> = {
  'DOC-2026-004': ['case-12'],
  'DOC-2026-006': ['case-11'],
  'DOC-2026-009': ['case-7'],
};
for (const [documentNumber, relatedCaseIds] of Object.entries(relatedCaseLinks)) {
  const document = db.documents.find((item) => item.documentNumber === documentNumber);
  if (document) document.relatedCaseIds = relatedCaseIds;
}

db.correspondence = [
  { id: 'corr-1', correspondenceNumber: 'COR-2026-001', subject: 'CEO request for Sepik suspension update', direction: 'Incoming', date: '2026-02-16', sender: 'CEO Office', recipient: 'Legal Division', category: 'Regulatory Communications', priority: 'High', confidentiality: 'Confidential', assignedTo: ['Legal Manager'], actionRequired: 'Response', dueDate: '2026-02-20', responseReference: 'COR-2026-002', entityId: 'ENT-003', caseId: 'case-1', attachments: ['doc-1'], status: 'Closed', closedDate: '2026-02-20', approvedBy: 'u-ceo', approvedAt: '2026-02-20' },
  { id: 'corr-2', correspondenceNumber: 'COR-2026-002', subject: 'Kumul inquiry holding response', direction: 'Outgoing', date: '2026-03-05', sender: 'SCPNG CEO', recipient: 'Kumul Capital Markets Limited', category: 'Regulatory Communications', priority: 'High', confidentiality: 'Confidential', assignedTo: ['General Counsel'], actionRequired: 'Response', dueDate: '2026-03-19', responseReference: null, entityId: 'ENT-001', caseId: 'case-2', attachments: ['doc-2'], status: 'Awaiting Response' },
  { id: 'corr-3', correspondenceNumber: 'COR-2026-003', subject: 'Prospectus clarification request', direction: 'Incoming', date: '2026-03-18', sender: 'PNG Infrastructure Notes PLC', recipient: 'SCPNG CEO', category: 'Regulatory Communications', priority: 'Medium', confidentiality: 'Internal', assignedTo: ['Senior Legal Officer'], actionRequired: 'Review', dueDate: '2026-04-01', responseReference: null, entityId: 'ENT-009', caseId: 'case-4', attachments: ['doc-4'], status: 'Under Review' },
  { id: 'corr-4', correspondenceNumber: 'COR-2026-004', subject: 'Revocation proceedings service update', direction: 'Incoming', date: '2026-03-29', sender: 'External Counsel', recipient: 'General Counsel', category: 'Complaints Escalated to CEO', priority: 'Critical', confidentiality: 'Restricted', assignedTo: ['General Counsel'], actionRequired: 'Review', dueDate: '2026-04-10', responseReference: null, entityId: 'ENT-010', caseId: 'case-5', attachments: ['doc-5'], status: 'Investigating' },
  { id: 'corr-5', correspondenceNumber: 'COR-2026-005', subject: 'Board delegation advice request', direction: 'Incoming', date: '2026-04-12', sender: 'Chairman', recipient: 'Legal Manager', category: 'Board Communications', priority: 'High', confidentiality: 'Confidential', assignedTo: ['Legal Manager'], actionRequired: 'Approval', dueDate: '2026-04-22', responseReference: null, entityId: 'ENT-006', caseId: 'case-8', attachments: ['doc-8'], status: 'In Progress' },
  { id: 'corr-6', correspondenceNumber: 'COR-2026-006', subject: 'Custody compliance notice dispatch', direction: 'Outgoing', date: '2026-05-11', sender: 'SCPNG CEO', recipient: 'National Capital Custodians', category: 'Regulatory Communications', priority: 'Medium', confidentiality: 'Internal', assignedTo: ['Legal Manager'], actionRequired: 'Information Only', dueDate: null, responseReference: null, entityId: 'ENT-011', caseId: 'case-10', attachments: ['doc-10'], status: 'Closed', closedDate: '2026-05-19', approvedBy: 'u-lm', approvedAt: '2026-05-12' },
  { id: 'corr-7', correspondenceNumber: 'COR-2026-007', subject: 'Trustee conditions consultation', direction: 'Outgoing', date: '2026-05-26', sender: 'SCPNG Legal', recipient: 'Highlands Trustees & Custody', category: 'Stakeholder Letters', priority: 'Medium', confidentiality: 'Internal', assignedTo: ['Senior Legal Officer'], actionRequired: 'Response', dueDate: '2026-06-10', responseReference: null, entityId: 'ENT-005', caseId: 'case-11', attachments: [], status: 'Open' },
  { id: 'corr-8', correspondenceNumber: 'COR-2026-008', subject: 'Disclosure matter CEO briefing', direction: 'Incoming', date: '2026-06-02', sender: 'Market Supervision', recipient: 'CEO Office', category: 'Internal Executive Directives', priority: 'High', confidentiality: 'Confidential', assignedTo: ['CEO Office'], actionRequired: 'Review', dueDate: '2026-06-12', responseReference: null, entityId: 'ENT-004', caseId: 'case-12', attachments: [], status: 'Awaiting Response' },
  { id: 'corr-9', correspondenceNumber: 'COR-2026-009', subject: 'Adviser agreement confirmation', direction: 'Outgoing', date: '2026-06-08', sender: 'SCPNG Legal', recipient: 'Motuan Asset Advisors', category: 'Stakeholder Letters', priority: 'Low', confidentiality: 'Internal', assignedTo: ['Legal Officer'], actionRequired: 'Information Only', dueDate: null, responseReference: 'COR-2026-007', entityId: 'ENT-008', caseId: 'case-9', attachments: ['doc-9'], status: 'Responded', closedDate: '2026-06-13' },
];

db.correspondence.forEach((item) => {
  item.attachments.forEach((documentId) => {
    const doc = db.documents.find((candidate) => candidate.id === documentId);
    if (doc) doc.correspondenceId = item.id;
  });
});

export function nextNumber(kind: 'case' | 'document' | 'correspondence', prefix: string) {
  db.counters[kind] += 1;
  return `${prefix}-2026-${String(db.counters[kind]).padStart(3, '0')}`;
}

export function nextEntityId() {
  db.counters.entity += 1;
  return `ENT-${String(db.counters.entity).padStart(3, '0')}`;
}
