import type { Activity, AuditLog, Case, CaseFilter, CaseInput, Correspondence, CorrespondenceFilter, CorrespondenceInput, DocumentFilter, DocumentInput, Entity, EntityFilter, EntityImportResult, EntityImportRow, EntityInput, LegalDocument, NewVersionInput, Note, SearchResult, User } from '@/types';

export interface CaseService {
  getAll(filter?: CaseFilter, user?: User): Promise<Case[]>;
  getById(id: string, user?: User): Promise<Case | null>;
  create(input: CaseInput, user: User): Promise<Case>;
  update(id: string, patch: Partial<CaseInput>, user: User, reason?: string): Promise<Case>;
  remove(id: string, user: User): Promise<void>;
}

export interface DocumentService {
  getAll(filter?: DocumentFilter, user?: User): Promise<LegalDocument[]>;
  getById(id: string, user?: User): Promise<LegalDocument | null>;
  create(input: DocumentInput, user: User): Promise<LegalDocument>;
  addVersion(id: string, version: NewVersionInput, user: User): Promise<LegalDocument>;
  update(id: string, patch: Partial<DocumentInput>, user: User): Promise<LegalDocument>;
  remove(id: string, user: User): Promise<void>;
  download(id: string, user: User): Promise<void>;
}

export interface CorrespondenceService {
  getAll(filter?: CorrespondenceFilter): Promise<Correspondence[]>;
  getById(id: string): Promise<Correspondence | null>;
  create(input: CorrespondenceInput, user: User): Promise<Correspondence>;
  update(id: string, patch: Partial<CorrespondenceInput>, user: User): Promise<Correspondence>;
  approve(id: string, user: User): Promise<Correspondence>;
  remove(id: string, user: User): Promise<void>;
}

export interface EntityService {
  getAll(filter?: EntityFilter): Promise<Entity[]>;
  getById(id: string): Promise<Entity | null>;
  search(query: string): Promise<Entity[]>;
  /** Gated to manageEntities. Creates a provisional, LMS-authored entity (source: 'Manual') pending reconciliation with Licensing. */
  create(input: EntityInput, user: User): Promise<Entity>;
  update(id: string, patch: Partial<EntityInput>, user: User): Promise<Entity>;
  /** Upserts by entityId — the mechanism for both Licensing API sync and file (CSV/XLSX) import. */
  importMany(rows: EntityImportRow[], user: User): Promise<EntityImportResult>;
}

export interface NoteService {
  getByCase(caseId: string): Promise<Note[]>;
  create(caseId: string, body: string, user: User): Promise<Note>;
}

export interface ActivityService {
  getByCase(caseId: string): Promise<Activity[]>;
}

export interface AuditService {
  getAll(): Promise<AuditLog[]>;
  record(input: Omit<AuditLog, 'id' | 'date'>): Promise<AuditLog>;
}

export interface SearchService {
  search(query: string, user: User, kind?: string): Promise<SearchResult[]>;
}

export interface EntityExposureRow {
  entityId: string;
  entityName: string;
  openCases: number;
  documents: number;
}

export interface OfficerWorkloadRow {
  officerId: string;
  name: string;
  openCases: number;
  activities: number;
}

export interface OutstandingCorrespondenceSummary {
  count: number;
  avgResponseDays: number;
}

export interface ReportService {
  summary(user: User): Promise<Record<string, number>>;
  audit(): Promise<AuditLog[]>;
  entityLegalExposure(): Promise<EntityExposureRow[]>;
  officerWorkload(): Promise<OfficerWorkloadRow[]>;
  outstandingCorrespondence(): Promise<OutstandingCorrespondenceSummary>;
}
