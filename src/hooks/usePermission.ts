import { PERMISSIONS, type Action } from '@/config/permissions';
import { useSession } from '@/context/useSession';
import { caseAccess } from '@/lib/utils';
import type { Case } from '@/types';

export function usePermission() {
  const { currentUser } = useSession();
  function can(action: Action) {
    return PERMISSIONS[action][currentUser.role];
  }
  function canDo(action: Action) {
    return can(action) !== 'none';
  }
  function canForCase(action: Action, item: Case) {
    return caseAccess(action, item, currentUser);
  }
  return { can, canDo, canForCase, role: currentUser.role, userId: currentUser.id, currentUser };
}
