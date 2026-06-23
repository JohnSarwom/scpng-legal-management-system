import type { CaseStatus, CaseType, ConfidentialClass, CorrespondenceAction, CorrespondenceCategory, CorrespondenceConfidentiality, CorrespondenceDirection, CorrespondencePriority, CorrespondenceStatus, DocumentCategory, EntitySource, EntityStatus, EntityType, Role } from '@/config/enums';

export interface Entity {
  entityId: string;
  entityName: string;
  entityStatus: EntityStatus;
  entityType: EntityType;
  registrationDetails: string;
  licenseNumber?: string;
  registrationDate?: string;
  /** Where this record came from: synced from Licensing, file-imported, or manually entered in LMS pending reconciliation. */
  source: EntitySource;
  createdAt?: string;
  updatedAt?: string;
}

export type EntityInput = Omit<Entity, 'entityId' | 'createdAt' | 'updatedAt'>;
export interface EntityFilter {
  query?: string;
  status?: string;
  type?: string;
  source?: string;
}
/** A row from an API sync or file upload. Supply entityId to upsert an existing record; omit it to create a new one. */
export type EntityImportRow = Partial<EntityInput> & { entityId?: string; entityName: string };
export interface EntityImportResult {
  created: number;
  updated: number;
  entities: Entity[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Case {
  id: string;
  caseNumber: string;
  caseTitle: string;
  entityId: string;
  caseType: CaseType;
  description: string;
  responsibleOfficerId: string;
  status: CaseStatus;
  dateOpened: string;
  dateClosed: string | null;
  isConfidential: boolean;
  confidentialClass: ConfidentialClass | null;
  grantedUserIds?: string[];
  grantedEditUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type CaseInput = Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>;
export interface CaseFilter {
  query?: string;
  status?: string;
  type?: string;
  officerId?: string;
  entityId?: string;
  confidentiality?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  includeArchived?: boolean;
}

export interface DocumentVersion {
  version: number;
  fileName: string;
  updatedBy: string;
  updatedAt: string;
  note?: string;
}

export interface LegalDocument {
  id: string;
  documentNumber: string;
  title: string;
  category: DocumentCategory;
  currentVersion: number;
  versions: DocumentVersion[];
  entityId: string | null;
  caseId: string | null;
  relatedCaseIds?: string[];
  correspondenceId: string | null;
  uploadedBy: string;
  uploadDate: string;
  status: 'Draft' | 'Active' | 'Superseded' | 'Archived';
  isConfidential: boolean;
  classification: 'Public' | 'Restricted' | 'Confidential' | 'Executive-Confidential';
  sourceUrl?: string;
  expiryDate?: string;
}

export type DocumentInput = Omit<LegalDocument, 'id' | 'documentNumber' | 'currentVersion' | 'versions' | 'uploadedBy' | 'uploadDate'> & {
  fileName: string;
  note?: string;
};
export interface NewVersionInput {
  fileName: string;
  updatedBy: string;
  note?: string;
}
export interface DocumentFilter {
  query?: string;
  category?: string;
  status?: string;
  entityId?: string;
  caseId?: string;
  correspondenceId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}

export interface Correspondence {
  id: string;
  correspondenceNumber: string;
  subject: string;
  direction: CorrespondenceDirection;
  date: string;
  sender: string;
  recipient: string;
  category: CorrespondenceCategory;
  priority: CorrespondencePriority;
  confidentiality: CorrespondenceConfidentiality;
  /** Officers, executives, or teams responsible for actioning the correspondence. */
  assignedTo: string[];
  actionRequired: CorrespondenceAction;
  /** Date a response is required by, if any. */
  dueDate?: string | null;
  /** Reference to the response document/correspondence, once issued. */
  responseReference?: string | null;
  entityId: string | null;
  caseId: string | null;
  attachments: string[];
  status: CorrespondenceStatus;
  closedDate?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export type CorrespondenceInput = Omit<Correspondence, 'id' | 'correspondenceNumber' | 'approvedBy' | 'approvedAt'>;
export interface CorrespondenceFilter {
  query?: string;
  direction?: string;
  status?: string;
  category?: string;
  priority?: string;
  confidentiality?: string;
  entityId?: string;
  caseId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}

export interface Note {
  id: string;
  caseId: string;
  body: string;
  createdBy: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  caseId: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: string;
  date: string;
  action: 'Create' | 'Update' | 'Delete' | 'Upload' | 'Download' | 'Status Change' | 'View';
  module: 'Cases' | 'Documents' | 'Correspondence' | 'Entities' | 'System';
  recordRef: string;
}

export type SearchResult =
  | { kind: 'entity'; record: Entity; context: string }
  | { kind: 'case'; record: Case; context: string }
  | { kind: 'document'; record: LegalDocument; context: string }
  | { kind: 'correspondence'; record: Correspondence; context: string };
