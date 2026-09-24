export const RESUME_CONTEXT_BASE_KEY = 'aiic.resumeContext.v1';
export const ACTIVE_USER_ID_KEY = 'aiic.activeUserId';

export interface PersistedResumeContext {
  resumeId: string;
  resumeFileName: string;
  resumeStatus: string;
  resumeText: string;
  jobDescription: string;
  updatedAt: string;
}

interface JwtPayload {
  sub?: string;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return atob(padded);
}

export function getResumeContextStorageKey(userId: string): string {
  return `${RESUME_CONTEXT_BASE_KEY}:${userId}`;
}

export function setActiveUserId(userId: string): void {
  localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
}

export function getActiveUserId(): string | null {
  return localStorage.getItem(ACTIVE_USER_ID_KEY);
}

export function clearActiveUserId(): void {
  localStorage.removeItem(ACTIVE_USER_ID_KEY);
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
      return null;
    }

    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson) as JwtPayload;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function resolveCurrentUserId(token: string): string | null {
  const activeUserId = getActiveUserId();
  if (activeUserId) {
    return activeUserId;
  }

  const tokenUserId = getUserIdFromToken(token);
  if (tokenUserId) {
    setActiveUserId(tokenUserId);
  }

  return tokenUserId;
}

export function readResumeContextByUserId(userId: string): PersistedResumeContext | null {
  const raw = localStorage.getItem(getResumeContextStorageKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedResumeContext;
  } catch {
    localStorage.removeItem(getResumeContextStorageKey(userId));
    return null;
  }
}

export function saveResumeContextByUserId(userId: string, context: PersistedResumeContext): void {
  localStorage.setItem(getResumeContextStorageKey(userId), JSON.stringify(context));
}

export function removeResumeContextByUserId(userId: string): void {
  localStorage.removeItem(getResumeContextStorageKey(userId));
}

export function removeLegacyResumeContext(): void {
  localStorage.removeItem(RESUME_CONTEXT_BASE_KEY);
}

export function migrateLegacyResumeContextToUser(userId: string): void {
  const userKey = getResumeContextStorageKey(userId);
  if (localStorage.getItem(userKey)) {
    return;
  }

  const legacy = localStorage.getItem(RESUME_CONTEXT_BASE_KEY);
  if (!legacy) {
    return;
  }

  try {
    const parsed = JSON.parse(legacy) as PersistedResumeContext;
    localStorage.setItem(userKey, JSON.stringify(parsed));
  } catch {
    // Ignore malformed legacy payload and clear it.
  }

  localStorage.removeItem(RESUME_CONTEXT_BASE_KEY);
}

export function loadResumeContextForToken(token: string): PersistedResumeContext | null {
  const userId = resolveCurrentUserId(token);
  if (!userId) {
    return null;
  }

  migrateLegacyResumeContextToUser(userId);
  return readResumeContextByUserId(userId);
}

export function saveResumeContextForToken(token: string, context: PersistedResumeContext): void {
  const userId = resolveCurrentUserId(token);
  if (!userId) {
    return;
  }

  saveResumeContextByUserId(userId, context);
}

export function clearResumeContextForToken(token: string): void {
  const userId = resolveCurrentUserId(token);
  if (userId) {
    removeResumeContextByUserId(userId);
  }

  removeLegacyResumeContext();
}
