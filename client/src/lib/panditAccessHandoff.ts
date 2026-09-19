export const PANDIT_ACCESS_HANDOFF_KEY = "vedic-tatva:pandit-access-signup";
const HANDOFF_MAX_AGE_MS = 30 * 60 * 1000;

export type PanditAccessSignupHandoff = {
  fullName: string;
  phone: string;
  email: string;
  stateId: number;
  cityId: number;
  stateName: string;
  cityName: string;
  languages: string;
  experience: string;
  createdAt: number;
};

export function savePanditAccessHandoff(
  handoff: Omit<PanditAccessSignupHandoff, "createdAt">,
): boolean {
  try {
    window.sessionStorage.setItem(
      PANDIT_ACCESS_HANDOFF_KEY,
      JSON.stringify({ ...handoff, createdAt: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}

export function readPanditAccessHandoff(): PanditAccessSignupHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(PANDIT_ACCESS_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PanditAccessSignupHandoff>;
    const age = Date.now() - Number(parsed.createdAt);
    if (
      typeof parsed.fullName !== "string"
      || typeof parsed.phone !== "string"
      || typeof parsed.email !== "string"
      || !Number.isInteger(parsed.stateId)
      || !Number.isInteger(parsed.cityId)
      || typeof parsed.stateName !== "string"
      || typeof parsed.cityName !== "string"
      || typeof parsed.languages !== "string"
      || typeof parsed.experience !== "string"
      || !Number.isFinite(parsed.createdAt)
      || age < 0
      || age > HANDOFF_MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(PANDIT_ACCESS_HANDOFF_KEY);
      return null;
    }
    return parsed as PanditAccessSignupHandoff;
  } catch {
    try {
      window.sessionStorage.removeItem(PANDIT_ACCESS_HANDOFF_KEY);
    } catch {
      // Ignore storage failures; the full application remains usable.
    }
    return null;
  }
}

export function clearPanditAccessHandoff() {
  try {
    window.sessionStorage.removeItem(PANDIT_ACCESS_HANDOFF_KEY);
  } catch {
    // Ignore storage failures; the full application remains usable.
  }
}