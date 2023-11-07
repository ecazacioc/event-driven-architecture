import type { ChangeNotificationEvent } from './types';
import { NOTIFICATION_TYPE_DELETED } from './types';
import { getIntegrationStatesById } from './dynamodb';

// Extend this list with reference types which we are interested in (e.g. handle updates for)
const allowedTypes = ['product'];

/**
 * Invalidation process will result into set of changes which are up to date with respective entities in CT:
 * 1) Only allowed reference types are being valid for processing (see allowedTypes)
 * 2) By comparing 'id' and 'version' from change notification with the fetched CT resource we determine if change is still valid. If not - we skip the change processing
 *
 * @param changes update notifications from CT
 * @returns valid update notification along with corresponding fetched resource
 */
export async function invalidateChanges(changes: ChangeNotificationEvent[]): Promise<ChangeNotificationEvent[]> {
  const allowedChanges = changes.filter((record) => allowedTypes.includes(record.resource.typeId));

  return await Promise.all(allowedChanges.filter(isUpdateValid));
}

/*
 * Checks if change received from CT is still valid:
 * 1) Changes about deletion are always valid.
 * 2) Changes about creation or update are valid if their version correspond to version in CT.
 * 3) If resource is not available in CT and it's not a deletion message, we are not interested in it
 */
async function isUpdateValid({
  notificationType,
  resource: { id },
  version,
}: ChangeNotificationEvent): Promise<boolean> {
  if (notificationType === NOTIFICATION_TYPE_DELETED) {
    return true;
  }
  const mostRecentVersion = (await getIntegrationStatesById(id))[0]?.version;
  const isActualVersion = !mostRecentVersion || version > mostRecentVersion;

  if (!isActualVersion) {
    console.log(
      `Discard change notification event for [id: ${id}, version: ${version}] as it is not the most recent state in CT [version: ${mostRecentVersion}]`,
    );
  }

  return isActualVersion;
}
