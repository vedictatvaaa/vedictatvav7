import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Search } from "lucide-react";
import { downloadCsv } from "@/lib/csvExport";
import { SkeletonTable } from "./SkeletonTable";
import { EmptyState } from "./EmptyState";

export interface AdminDataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  csvValue?: (row: T) => string | number | null | undefined;
  className?: string;
  hidden?: "sm" | "md" | "lg";
}

interface AdminDataTableProps<T extends { id: number | string }> {
  rows: T[];
  columns: AdminDataTableColumn<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchAccessor?: (row: T) => string;
  pageSize?: number;
  csvFilename?: string;
  rowTestId?: (row: T) => string;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  testId?: string;
}

export function AdminDataTable<T extends { id: number | string }>({
  rows,
  columns,
  loading,
  searchPlaceholder = "Search...",
  searchAccessor,
  pageSize = 25,
  csvFilename,
  rowTestId,
  bulkActions,
  emptyTitle = "Nothing to show yet",
  emptyDescription,
  testId,
}: AdminDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim() || !searchAccessor) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchAccessor(r).toLowerCase().includes(q));
  }, [rows, query, searchAccessor]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const selectedRows = sorted.filter((r) => selected.has(r.id));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const togglePage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      pageRows.forEach((r) => next.delete(r.id));
    } else {
      pageRows.forEach((r) => next.add(r.id));
    }
    setSelected(next);
  };

  const toggleRow = (id: string | number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const exportCsv = () => {
    if (!csvFilename) return;
    const csvCols = columns.map((c) => ({ key: c.key, label: c.header }));
    const data = sorted.map((row) =>
      columns.reduce<Record<string, unknown>>((acc, col) => {
        const v = col.csvValue ? col.csvValue(row) : (col.sortValue ? col.sortValue(row) : "");
        acc[col.key] = v ?? "";
        return acc;
      }, {})
    );
    downloadCsv(csvFilename, csvCols, data);
  };

  if (loading) return <SkeletonTable columns={columns.length + (bulkActions ? 1 : 0)} />;

  return (
    <div className="space-y-3" data-testid={testId ?? "admin-data-table"}>
      <div className="flex flex-row flex-wrap items-center gap-2">
        {searchAccessor && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-9"
              data-testid="input-table-search"
            />
          </div>
        )}
        {csvFilename && (
          <Button variant="outline" size="sm" onClick={exportCsv} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        )}
      </div>

      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-row flex-wrap items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <span className="text-sm text-primary font-medium">{selectedRows.length} selected</span>
          {bulkActions(selectedRows, () => setSelected(new Set()))}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {bulkActions && (
                    <th className="px-3 py-2 w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={togglePage}
                        data-testid="checkbox-select-page"
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const sortable = !!col.sortValue;
                    const active = sortKey === col.key;
                    const Icon = !sortable
                      ? null
                      : !active
                        ? ChevronsUpDown
                        : sortDir === "asc"
                          ? ChevronUp
                          : ChevronDown;
                    const hideClass =
                      col.hidden === "lg" ? "hidden lg:table-cell" :
                      col.hidden === "md" ? "hidden md:table-cell" :
                      col.hidden === "sm" ? "hidden sm:table-cell" : "";
                    return (
                      <th
                        key={col.key}
                        className={`px-3 py-2 text-left font-semibold text-foreground ${hideClass} ${col.className || ""}`}
                      >
                        {sortable ? (
                          <button
                            onClick={() => toggleSort(col.key)}
                            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                            data-testid={`sort-${col.key}`}
                          >
                            {col.header}
                            {Icon && <Icon className="w-3 h-3" />}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover-elevate"
                    data-testid={rowTestId ? rowTestId(row) : `row-${row.id}`}
                  >
                    {bulkActions && (
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                          data-testid={`checkbox-row-${row.id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const hideClass =
                        col.hidden === "lg" ? "hidden lg:table-cell" :
                        col.hidden === "md" ? "hidden md:table-cell" :
                        col.hidden === "sm" ? "hidden sm:table-cell" : "";
                      return (
                        <td key={col.key} className={`px-3 py-2 align-middle ${hideClass} ${col.className || ""}`}>
                          {col.accessor(row)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-row flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {sorted.length} total
              </span>
              <div className="flex flex-row items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
