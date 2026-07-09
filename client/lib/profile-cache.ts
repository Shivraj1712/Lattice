import { api, PublicProfile } from "./api";

const profileCache: Map<string, PublicProfile | null> = new Map();

export async function fetchCachedPublicProfile(email: string): Promise<PublicProfile | null> {
  if (!email) return null;
  if (profileCache.has(email)) return profileCache.get(email) || null;

  try {
    const res = await api.getPublicProfile(email);
    if (res && res.data) {
      profileCache.set(email, res.data);
      return res.data;
    }
  } catch (err) {
    // swallow — return null and cache negative result to avoid repeated failing requests
  }

  profileCache.set(email, null);
  return null;
}

export function getCachedProfile(email: string): PublicProfile | null {
  return profileCache.get(email) || null;
}
