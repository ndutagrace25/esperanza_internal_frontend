import api from "../api";
import type { ClientIntegration } from "../types";

export type CreateClientIntegrationData = {
  clientId: string;
  label: string;
  value: string;
};

export type UpdateClientIntegrationData = Partial<{
  label: string;
  value: string;
}>;

export async function getByClientId(
  clientId: string
): Promise<ClientIntegration[]> {
  const response = await api.get<ClientIntegration[]>(
    `/client-integrations?clientId=${encodeURIComponent(clientId)}`
  );
  return response.data;
}

export async function getById(id: string): Promise<ClientIntegration> {
  const response = await api.get<ClientIntegration>(
    `/client-integrations/${id}`
  );
  return response.data;
}

export async function create(
  data: CreateClientIntegrationData
): Promise<ClientIntegration> {
  const response = await api.post<ClientIntegration>(
    "/client-integrations",
    data
  );
  return response.data;
}

export async function update(
  id: string,
  data: UpdateClientIntegrationData
): Promise<ClientIntegration> {
  const response = await api.patch<ClientIntegration>(
    `/client-integrations/${id}`,
    data
  );
  return response.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/client-integrations/${id}`);
}

export const clientIntegrationService = {
  getByClientId,
  getById,
  create,
  update,
  remove,
};
