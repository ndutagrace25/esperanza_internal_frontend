import api from "../api";
import type { ClientSubscription } from "../types";

export type CreateClientSubscriptionData = {
  clientId: string;
  code: string;
  apiBaseUrl: string;
  mpesaBaseUrl?: string | null;
  expiryDate: string;
  status?: ClientSubscription["status"];
};

export type UpdateClientSubscriptionData = Partial<CreateClientSubscriptionData>;

export type RenewClientSubscriptionData = {
  licenseExpiryDate: string;
};

export type ClientSubscriptionListFilters = {
  clientId?: string;
  expiryFrom?: string;
  expiryTo?: string;
};

export async function getAllClientSubscriptions(
  filters?: ClientSubscriptionListFilters
): Promise<ClientSubscription[]> {
  const params = new URLSearchParams();
  if (filters?.clientId) {
    params.append("clientId", filters.clientId);
  }
  if (filters?.expiryFrom) {
    params.append("expiryFrom", filters.expiryFrom);
  }
  if (filters?.expiryTo) {
    params.append("expiryTo", filters.expiryTo);
  }
  const qs = params.toString();
  const response = await api.get<ClientSubscription[]>(
    `/client-subscriptions${qs ? `?${qs}` : ""}`
  );
  return response.data;
}

export async function getClientSubscriptionById(
  id: string
): Promise<ClientSubscription> {
  const response = await api.get<ClientSubscription>(
    `/client-subscriptions/${id}`
  );
  return response.data;
}

export async function createClientSubscription(
  data: CreateClientSubscriptionData
): Promise<ClientSubscription> {
  const response = await api.post<ClientSubscription>(
    "/client-subscriptions",
    data
  );
  return response.data;
}

export async function updateClientSubscription(
  id: string,
  data: UpdateClientSubscriptionData
): Promise<ClientSubscription> {
  const response = await api.patch<ClientSubscription>(
    `/client-subscriptions/${id}`,
    data
  );
  return response.data;
}

export async function renewClientSubscription(
  id: string,
  data: RenewClientSubscriptionData
): Promise<ClientSubscription> {
  const response = await api.post<ClientSubscription>(
    `/client-subscriptions/${id}/renew`,
    data
  );
  return response.data;
}

// ---- Ventura licensing (support actions) ----

/** Licence code for a server without internet, bound to its installation id */
export async function issueOfflineLicence(
  id: string,
  installationId: string
): Promise<{ license: string }> {
  const response = await api.post<{ license: string }>(
    `/client-subscriptions/${id}/licence/offline`,
    { installationId }
  );
  return response.data;
}

/** One-time key to move the licence to a new server */
export async function createLicenceActivationKey(
  id: string
): Promise<{ activationKey: string }> {
  const response = await api.post<{ activationKey: string }>(
    `/client-subscriptions/${id}/licence/activation-key`
  );
  return response.data;
}

/** Unbind the installation: the next server that checks in takes the licence */
export async function resetLicenceInstallation(id: string): Promise<void> {
  await api.post(`/client-subscriptions/${id}/licence/reset-installation`);
}

export const clientSubscriptionService = {
  getAll: getAllClientSubscriptions,
  getById: getClientSubscriptionById,
  create: createClientSubscription,
  update: updateClientSubscription,
  renew: renewClientSubscription,
  issueOfflineLicence,
  createLicenceActivationKey,
  resetLicenceInstallation,
};
