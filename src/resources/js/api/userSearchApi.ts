import clientApi from "./_clientApi";
import type { PaginatedResponse, User, UserSearchFilters } from "../types/api";

/**
 * Busca usuários no backend via Elasticsearch (POST /users/search).
 * Os filtros são enviados dentro da chave "filters".
 */
export async function userSearchApi(
  filters: UserSearchFilters,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<User>> {
  const { data } = await clientApi.post<PaginatedResponse<User>>("/users/search", {
    filters,
    page,
    limit,
  });

  return data;
}
