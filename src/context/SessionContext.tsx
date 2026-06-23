import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '@/config/enums';
import type { User } from '@/types';
import { users as seedUsers } from '@/services/mock/db';

// Single source of truth: the session roster mirrors the seeded user records so
// that responsible-officer ids on cases always resolve to a name.
export const DEMO_USERS: User[] = seedUsers;

export interface SessionContextValue {
  currentUser: User;
  setRole: (role: Role) => void;
  users: User[];
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS.find((user) => user.role === 'Legal Manager') ?? DEMO_USERS[0]);
  const value = useMemo(
    () => ({
      currentUser,
      users: DEMO_USERS,
      setRole: (role: Role) => setCurrentUser(DEMO_USERS.find((user) => user.role === role) ?? { id: `u-${role}`, name: role, role }),
    }),
    [currentUser],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
