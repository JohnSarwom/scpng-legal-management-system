import { mockAuditService } from './mock/auditService';
import { mockActivityService } from './mock/activityService';
import { mockCaseService } from './mock/caseService';
import { mockCorrespondenceService } from './mock/correspondenceService';
import { mockDocumentService } from './mock/documentService';
import { mockEntityService } from './mock/entityService';
import { mockNoteService } from './mock/noteService';
import { mockReportService } from './mock/reportService';
import { mockSearchService } from './mock/searchService';

export const caseService = mockCaseService;
export const documentService = mockDocumentService;
export const correspondenceService = mockCorrespondenceService;
export const entityService = mockEntityService;
export const noteService = mockNoteService;
export const activityService = mockActivityService;
export const auditService = mockAuditService;
export const searchService = mockSearchService;
export const reportService = mockReportService;

// Future backend switch point:
// export const caseService = supabaseCaseService;
// export const documentService = supabaseDocumentService;
// export const correspondenceService = supabaseCorrespondenceService;
// export const entityService = licensingEntityService;
