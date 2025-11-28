import api from "../api";
import type { Client, PaginatedResponse, PaginationOptions } from "../types";

export type CreateClientData = Omit<
  Client,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "broughtInBy"
  | "assignedTo"
  | "broughtInById"
  | "assignedToId"
> & {
  assignedToId?: string | null;
  broughtInById?: string | null;
};

export type UpdateClientData = Partial<
  Omit<Client, "id" | "createdAt" | "updatedAt" | "broughtInBy" | "assignedTo">
> & {
  assignedToId?: string | null;
  broughtInById?: string | null;
};

// Get all clients with pagination
export async function getAllClients(
  options?: PaginationOptions
): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }

  const queryString = params.toString();
  const url = `/clients${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<Client>>(url);
  return response.data;
}

// Get client by ID
export async function getClientById(id: string): Promise<Client> {
  const response = await api.get<Client>(`/clients/${id}`);
  return response.data;
}

// Create client
export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await api.post<Client>("/clients", data);
  return response.data;
}

// Update client
export async function updateClient(
  id: string,
  data: UpdateClientData
): Promise<Client> {
  const response = await api.patch<Client>(`/clients/${id}`, data);
  return response.data;
}

// Delete client (archives it)
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export const clientService = {
  getAll: getAllClients,
  getById: getClientById,
  create: createClient,
  update: updateClient,
  delete: deleteClient,
};
