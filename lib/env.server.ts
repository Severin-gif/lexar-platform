import "server-only";

export function getBackendUrl() {
  return process.env.LEX_BACKEND_URL ?? null;
}

export function getAdminApiKey() {
  return process.env.ADMIN_API_KEY ?? null;
}
