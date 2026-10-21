import type { Database } from '@/server/db/client';
import { auditLogs, type AuditLogInsert } from '@/server/db/schema';

type Executor = Pick<Database, 'insert'>;

/**
 * Records an administrative action. Pass the transaction handle when the action
 * is part of a multi-statement change so the log commits (or rolls back) with it.
 * Never put secrets, tokens or file contents in `metadata`.
 */
export async function writeAudit(db: Executor, entry: AuditLogInsert): Promise<void> {
  await db.insert(auditLogs).values(entry);
}
