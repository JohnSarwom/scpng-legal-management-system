export const CASE_STATUSES = ['Draft', 'Open', 'Pending', 'Under Review', 'Closed', 'Archived'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_TYPES = ['Litigation', 'Employment', 'Contracts', 'Compliance', 'Regulatory', 'Other'] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  'Contracts',
  'Court Documents',
  'Affidavits',
  'Agreements',
  'Compliance Documents',
  'Legal Opinions',
  'Internal Memos',
  'External Correspondence',
  'Gazettal Notices (Internal)',
  'Gazettal Notices (External)',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const CORRESPONDENCE_DIRECTIONS = ['Incoming', 'Outgoing'] as const;
export type CorrespondenceDirection = (typeof CORRESPONDENCE_DIRECTIONS)[number];

export const CORRESPONDENCE_CATEGORIES = [
  'Ministerial Communications',
  'Board Communications',
  'Regulatory Communications',
  'Stakeholder Letters',
  'Investor Correspondence',
  'Government Agency Communications',
  'International Partner Communications',
  'Complaints Escalated to CEO',
  'Invitations & Event Correspondence',
  'Internal Executive Directives',
] as const;
export type CorrespondenceCategory = (typeof CORRESPONDENCE_CATEGORIES)[number];

export const CORRESPONDENCE_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export type CorrespondencePriority = (typeof CORRESPONDENCE_PRIORITIES)[number];

export const CORRESPONDENCE_CONFIDENTIALITY = ['Public', 'Internal', 'Confidential', 'Restricted'] as const;
export type CorrespondenceConfidentiality = (typeof CORRESPONDENCE_CONFIDENTIALITY)[number];

export const CORRESPONDENCE_ACTIONS = ['Response', 'Review', 'Approval', 'Information Only'] as const;
export type CorrespondenceAction = (typeof CORRESPONDENCE_ACTIONS)[number];

export const CORRESPONDENCE_STATUSES = ['Open', 'In Progress', 'Under Review', 'Investigating', 'Awaiting Response', 'Responded', 'Closed'] as const;
export type CorrespondenceStatus = (typeof CORRESPONDENCE_STATUSES)[number];

export const ROLES = [
  'CEO',
  'General Counsel',
  'Legal Manager',
  'Senior Legal Officer',
  'Legal Officer',
  'Executive Officer',
] as const;
export type Role = (typeof ROLES)[number];

export const CONFIDENTIAL_CLASSES = [
  'Executive Investigations',
  'Litigation Matters',
  'Employment Disciplinary Cases',
  'Board Matters',
  'Regulatory Investigations',
] as const;
export type ConfidentialClass = (typeof CONFIDENTIAL_CLASSES)[number];

export const ENTITY_STATUSES = ['Registered', 'Suspended', 'Revoked', 'Pending'] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const ENTITY_TYPES = [
  'Broker-Dealer',
  'Fund Manager',
  'Listed Issuer',
  'Trustee/Custodian',
  'Investment Adviser',
  'Market Participant',
  'Other',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_SOURCES = ['Licensing', 'Imported', 'Manual'] as const;
export type EntitySource = (typeof ENTITY_SOURCES)[number];
