import { db } from './db';
import { delay } from './delay';
import type { ActivityService } from '../types';

export const mockActivityService: ActivityService = {
  async getByCase(caseId) {
    await delay();
    return db.activities
      .filter((activity) => activity.caseId === caseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((activity) => ({ ...activity }));
  },
};
