/**
 * Helper de paginação server-side.
 *
 * Uso:
 *   const { skip, take, page, pageSize } = parsePagination(searchParams);
 *   const [rows, total] = await Promise.all([
 *     db.lead.findMany({ where, orderBy, skip, take }),
 *     db.lead.count({ where })
 *   ]);
 *   return paginatedResponse({ data: rows, total, page, pageSize });
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(sp: URLSearchParams | Record<string, string | string[] | undefined>) {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const page = Math.max(1, Number(get("page") ?? 1) || 1);
  const raw = Number(get("size") ?? get("pageSize") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, raw));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>({
  data,
  total,
  page,
  pageSize
}: {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages
    }
  };
}

export type PaginatedResult<T> = ReturnType<typeof paginatedResponse<T>>;
