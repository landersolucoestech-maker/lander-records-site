"use client";

import styles from "./AdminPagination.module.css";

function paginationItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1].filter((value) => value >= 1 && value <= total));
  const sorted = [...values].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous && value - previous > 1) result.push("ellipsis");
    result.push(value);
  });
  return result;
}

export function AdminPagination({
  currentPage,
  endItem,
  itemLabel = "registros",
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  startItem,
  totalItems,
  totalPages,
}: {
  currentPage: number;
  endItem: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  startItem: number;
  totalItems: number;
  totalPages: number;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const visibleCount = totalItems ? Math.max(0, endItem - startItem + 1) : 0;

  return (
    <footer className={styles.pagination} aria-label="Paginação">
      <div className={styles.summary}>
        <strong>{visibleCount} {itemLabel}</strong>
        <span>{totalItems ? `${startItem}–${endItem} de ${totalItems}` : "0 de 0"}</span>
      </div>

      <nav className={styles.controls} aria-label="Navegação de páginas">
        <button aria-label="Primeira página" disabled={safePage === 1} onClick={() => onPageChange(1)} type="button">«</button>
        <button aria-label="Página anterior" disabled={safePage === 1} onClick={() => onPageChange(Math.max(1, safePage - 1))} type="button">‹</button>
        {paginationItems(safePage, safeTotalPages).map((item, index) =>
          item === "ellipsis"
            ? <span className={styles.ellipsis} key={`ellipsis-${index}`}>…</span>
            : <button aria-current={safePage === item ? "page" : undefined} className={safePage === item ? styles.active : ""} key={item} onClick={() => onPageChange(item)} type="button">{item}</button>
        )}
        <button aria-label="Próxima página" disabled={safePage === safeTotalPages} onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))} type="button">›</button>
        <button aria-label="Última página" disabled={safePage === safeTotalPages} onClick={() => onPageChange(safeTotalPages)} type="button">»</button>
      </nav>

      <label className={styles.pageSize}>
        <span>Por página</span>
        <select aria-label="Registros por página" onChange={(event) => onPageSizeChange(Number(event.target.value))} value={pageSize}>
          {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </footer>
  );
}
