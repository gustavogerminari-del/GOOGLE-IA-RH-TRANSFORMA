import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado.',
  isLoading = false,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[#D5DEE8] bg-white shadow-xs ${className}`}>
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F1F5F9] text-[#334155] font-bold uppercase border-b border-[#D5DEE8]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`p-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D5DEE8]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-[#475569]">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-[#123657]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium text-[#0F172A]">Carregando dados...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-[#475569] font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={keyExtractor(item, index)} className="hover:bg-[#F8FAFC] transition-colors bg-white">
                {columns.map((col) => (
                  <td key={col.key} className={`p-3.5 text-[#0F172A] font-medium ${col.className || ''}`}>
                    {col.render ? col.render(item, index) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
