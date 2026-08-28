import { auth } from './firebase';

/**
 * Utility functions for Firestore operations
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: (auth?.currentUser as any)?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error Details]:', JSON.stringify(errInfo, null, 2));
  throw new Error(`[Firestore Error] Operação: ${operationType} | Path: ${path || 'N/A'} | Motivo: ${errInfo.error}`);
}

/**
 * Safely executes a Firestore write operation (setDoc, updateDoc, deleteDoc, etc.)
 * with automatic data sanitization and unified error handling layer.
 */
export async function safeFirestoreWrite<T>(
  operationFn: () => Promise<T>,
  operationType: OperationType,
  path: string
): Promise<{ success: boolean; result?: T; error?: FirestoreErrorInfo }> {
  try {
    const result = await operationFn();
    return { success: true, result };
  } catch (err: any) {
    const errInfo: FirestoreErrorInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth?.currentUser?.uid || null,
        email: auth?.currentUser?.email || null,
        emailVerified: auth?.currentUser?.emailVerified || null,
        isAnonymous: auth?.currentUser?.isAnonymous || null,
        tenantId: (auth?.currentUser as any)?.tenantId || null,
      },
      operationType,
      path,
    };
    console.error(`[Firestore Write Failed] [${operationType.toUpperCase()}] Collection/Path: ${path}`, errInfo);
    return { success: false, error: errInfo };
  }
}

/**
 * Safely executes a Firestore read operation (getDoc, getDocs, query, etc.)
 * with unified error handling and fallback return value.
 */
export async function safeFirestoreRead<T>(
  operationFn: () => Promise<T>,
  operationType: OperationType,
  path: string,
  fallbackValue: T
): Promise<{ data: T; success: boolean; error?: FirestoreErrorInfo }> {
  try {
    const data = await operationFn();
    return { data, success: true };
  } catch (err: any) {
    const errInfo: FirestoreErrorInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth?.currentUser?.uid || null,
        email: auth?.currentUser?.email || null,
        emailVerified: auth?.currentUser?.emailVerified || null,
        isAnonymous: auth?.currentUser?.isAnonymous || null,
        tenantId: (auth?.currentUser as any)?.tenantId || null,
      },
      operationType,
      path,
    };
    console.error(`[Firestore Read Failed] [${operationType.toUpperCase()}] Collection/Path: ${path}`, errInfo);
    return { data: fallbackValue, success: false, error: errInfo };
  }
}

/**
 * Safely formats dates coming from Firestore (Timestamp, Date, seconds object, string)
 */
export function formatFirestoreDate(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('pt-BR');
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString('pt-BR');
  }

  if (typeof value?.seconds === 'number') {
    return new Date(
      value.seconds * 1000
    ).toLocaleDateString('pt-BR');
  }

  return '';
}

/**
 * Recursively cleans any object or array before writing to Firestore.
 * - Removes undefined keys from objects
 * - Converts undefined values in arrays or top-level to null/filtered
 * - Preserves Date, Timestamp, FieldValue, null, and primitives
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  // Preserve Date instances
  if (data instanceof Date) {
    return data;
  }
  // Preserve Firestore Timestamp or FieldValue objects
  if ('toDate' in data && typeof (data as any).toDate === 'function') {
    return data;
  }
  if ('_methodName' in data || ('type' in data && (data as any).type === 'FieldValue')) {
    return data;
  }
  // Handle Array
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  // Handle Plain Object
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    const val = (data as Record<string, any>)[key];
    if (val !== undefined) {
      sanitized[key] = sanitizeFirestoreData(val);
    }
  }
  return sanitized as T;
}
