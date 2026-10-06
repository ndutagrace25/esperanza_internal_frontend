import api from "../api";

export type SmsRecipientClient = {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  alternatePhone: string | null;
  status: string;
  hasValidPhone: boolean;
};

export type SmsRecipientEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  roleName: string | null;
  hasValidPhone: boolean;
};

export type SmsRecipients = {
  clients: SmsRecipientClient[];
  employees: SmsRecipientEmployee[];
};

export type OtherRecipient = {
  name: string;
  phone: string;
};

export type BroadcastFailure = {
  type: "CLIENT" | "EMPLOYEE" | "OTHER";
  id: string;
  name: string;
  mobile: string | null;
  reason: string;
};

export type BroadcastResult = {
  requested: number;
  sent: number;
  failed: BroadcastFailure[];
  skipped: BroadcastFailure[];
};

export type BroadcastData = {
  message: string;
  clientIds: string[];
  employeeIds: string[];
  otherRecipients: OtherRecipient[];
};

// Get all clients and active employees that can receive bulk SMS (directors only)
export async function getRecipients(): Promise<SmsRecipients> {
  const response = await api.get<SmsRecipients>("/sms/recipients");
  return response.data;
}

// Send one message to the selected clients and employees (directors only)
export async function broadcast(data: BroadcastData): Promise<BroadcastResult> {
  const response = await api.post<BroadcastResult>("/sms/broadcast", data, {
    // Large recipient lists are sent in several batches to the SMS provider
    timeout: 120000,
  });
  return response.data;
}

export const smsService = {
  getRecipients,
  broadcast,
};
