import { CallableRequest } from 'firebase-functions/v2/https';

import { db } from '@keepers/shared';

/**
 * Returns the user document for the given uid.
 */
export const getUser =
  async () =>
  ({ data: uid, auth }: CallableRequest<string | null>) => {
    const uidToQuery = uid ?? auth?.uid;
    if (!uidToQuery) {
      return 'no user';
    }

    return db.users.getById(uidToQuery);
  };
