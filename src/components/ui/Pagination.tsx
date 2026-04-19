"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  hasNext,
  hasPrev
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const sp = useSearchParams();
  const pathname = usePathname();

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(nextPage));
    return `${pathname}?${params.toString()}`;
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav className="flex items-center justify-between gap-4 py-4 text-sm" aria-label="Paginação">
      <p className="text-[0.72rem] uppercase tracking-[0.12em] font-medium text-sand-100/55">
        {start}–{end} de {total.toLocaleString("pt-BR")}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[0.72rem] text-sand-100/55">
          Página <span className="text-sand-50 font-medium">{page}</span> de {totalPages}
        </span>
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-[2px] border hairline hover:border-gold-400/40 text-sand-100/70 hover:text-gold-300 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-[2px] border hairline text-sand-100/25 cursor-not-allowed">
            <ChevronLeft size={14} />
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-[2px] border hairline hover:border-gold-400/40 text-sand-100/70 hover:text-gold-300 transition-colors"
            aria-label="Próxima"
          >
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-[2px] border hairline text-sand-100/25 cursor-not-allowed">
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </nav>
  );
}
