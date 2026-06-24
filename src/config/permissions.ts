import type { Role } from './enums';

export type Action =
  | 'viewCases'
  | 'createCases'
  | 'editCases'
  | 'closeCases'
  | 'assignCases'
  | 'viewDocuments'
  | 'uploadDocuments'
  | 'editDocuments'
  | 'registerCorrespondence'
  | 'approveCorrespondence'
  | 'viewReports'
  | 'userManagement'
  | 'viewEntities'
  | 'manageEntities'
  | 'viewNotifications';

export type Access = 'full' | 'assigned' | 'limited' | 'none';

export const PERMISSIONS: Record<Action, Record<Role, Access>> = {
  viewCases: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'assigned', 'Legal Officer': 'assigned', 'Executive Officer': 'assigned' },
  createCases: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'none' },
  editCases: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'assigned', 'Executive Officer': 'none' },
  closeCases: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none', 'Legal Officer': 'none', 'Executive Officer': 'none' },
  assignCases: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none', 'Legal Officer': 'none', 'Executive Officer': 'none' },
  viewDocuments: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'full' },
  uploadDocuments: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'full' },
  editDocuments: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'assigned', 'Executive Officer': 'none' },
  registerCorrespondence: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'full' },
  approveCorrespondence: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none', 'Legal Officer': 'none', 'Executive Officer': 'none' },
  viewReports: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'limited', 'Legal Officer': 'limited', 'Executive Officer': 'limited' },
  userManagement: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'none', 'Senior Legal Officer': 'none', 'Legal Officer': 'none', 'Executive Officer': 'none' },
  viewEntities: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'full' },
  manageEntities: { CEO: 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none', 'Legal Officer': 'none', 'Executive Officer': 'none' },
  viewNotifications: { CEO: 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full', 'Legal Officer': 'full', 'Executive Officer': 'full' },
};
