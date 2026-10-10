import api from "../api";

export type StandbyPerson = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
};

export type StandbyWeekend = {
  id: string;
  /** Saturday of the weekend, e.g. "2026-10-10T00:00:00.000Z" */
  weekendStart: string;
  employeeId: string;
  employee: StandbyPerson;
  /** Whose turn it was, when a director changed the person */
  originalEmployeeId: string | null;
  originalEmployee: StandbyPerson | null;
  changeReason: string | null;
  changedBy: { id: string; firstName: string; lastName: string } | null;
  changedAt: string | null;
  reminderSentAt: string | null;
};

export type StandbyRota = {
  currentWeekendStart: string;
  rotation: {
    employeeId: string;
    position: number;
    employee: StandbyPerson;
  }[];
  weekends: StandbyWeekend[];
  activeEmployees: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
  }[];
};

export type StandbyNotification = { sent: number; errors: string[] };

export type StandbyReminderResult = {
  skipped: string | null;
  standby?: string;
  when?: string;
  sent: number;
  errors: string[];
};

/** e.g. "Sat 10 – Sun 11 Oct 2026" (dates are calendar dates at UTC midnight) */
export function formatWeekend(weekendStart: string): string {
  const sat = new Date(weekendStart);
  const sun = new Date(sat.getTime() + 24 * 60 * 60 * 1000);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
  return `Sat ${fmt(sat, { day: "numeric" })} – Sun ${fmt(sun, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName.trim()} ${p.lastName.trim()}`;
}

// Rotation order and recent/upcoming weekends (any employee)
export async function getRota(): Promise<StandbyRota> {
  const response = await api.get<StandbyRota>("/standby");
  return response.data;
}

// Replace the rotation order (directors only)
export async function setRotation(employeeIds: string[]): Promise<StandbyRota> {
  const response = await api.put<StandbyRota>("/standby/rotation", {
    employeeIds,
  });
  return response.data;
}

// Give a weekend to someone else; the rotation is notified by SMS (directors only)
export async function changeWeekend(
  id: string,
  employeeId: string,
  reason?: string
): Promise<{ weekend: StandbyWeekend; notification: StandbyNotification }> {
  // Several SMS are sent before the response returns
  const response = await api.patch(
    `/standby/weekends/${id}`,
    { employeeId, reason },
    { timeout: 60000 }
  );
  return response.data;
}

// Exchange the people of two weekends; the rotation is notified by SMS (directors only)
export async function swapWeekends(
  id: string,
  otherWeekendId: string,
  reason?: string
): Promise<{ weekends: StandbyWeekend[]; notification: StandbyNotification }> {
  const response = await api.post(
    `/standby/weekends/${id}/swap`,
    { otherWeekendId, reason },
    { timeout: 60000 }
  );
  return response.data;
}

// Send this weekend's standby SMS now (directors only)
export async function sendReminder(): Promise<StandbyReminderResult> {
  const response = await api.post<StandbyReminderResult>(
    "/standby/send-reminder",
    {},
    { timeout: 60000 }
  );
  return response.data;
}

export const standbyService = {
  getRota,
  setRotation,
  changeWeekend,
  swapWeekends,
  sendReminder,
};
