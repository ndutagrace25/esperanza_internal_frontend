import api from "../api";
import type { Role } from "../types";

// Get all roles
export async function getAllRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>("/roles");
  return response.data;
}

// Get role by ID
export async function getRoleById(id: string): Promise<Role> {
  const response = await api.get<Role>(`/roles/${id}`);
  return response.data;
}

// Export as object for backward compatibility
export const roleService = {
  getAll: getAllRoles,
  getById: getRoleById,
};
