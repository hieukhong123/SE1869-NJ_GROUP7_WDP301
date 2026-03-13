import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { MagnifyingGlass, CaretUp, CaretDown, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';

const Table = ({ data, columns }) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 9,
            },
        },
    });

    return (
        <div className="flex flex-col bg-white">
            
            {/* Search Bar & Actions Top */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80 group">
                    <MagnifyingGlass size={16} weight="light" className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-gray-200 pl-7 pr-0 py-2 text-sm text-gray-900 font-light focus:ring-0 focus:border-orange-800 transition-colors placeholder-gray-400"
                        placeholder="Search records..."
                    />
                    {/* Underline Animation */}
                    <div className="absolute bottom-[0px] left-0 w-0 h-[1px] bg-orange-800 transition-all duration-300 group-focus-within:w-full"></div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                    
                    {/* Table Header */}
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/50">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={`px-6 py-4 text-[10px] font-medium text-gray-500 uppercase tracking-widest whitespace-nowrap select-none ${
                                            header.column.getCanSort() ? 'cursor-pointer hover:text-gray-900 transition-colors' : ''
                                        }`}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {/* Sorting Icons */}
                                            {header.column.getIsSorted() && (
                                                <span className="text-orange-800">
                                                    {header.column.getIsSorted() === 'asc' ? (
                                                        <CaretUp size={12} weight="bold" />
                                                    ) : (
                                                        <CaretDown size={12} weight="bold" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    {/* Table Body */}
                    <tbody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr 
                                    key={row.id} 
                                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 group"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-4 text-sm font-light text-gray-700 whitespace-nowrap">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 font-light italic text-sm">
                                    No records found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Bottom */}
            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <span className="text-xs font-light text-gray-500 uppercase tracking-widest">
                    Page <strong className="font-medium text-gray-900">{table.getState().pagination.pageIndex + 1}</strong> of <strong className="font-medium text-gray-900">{table.getPageCount()}</strong>
                </span>

                <div className="flex items-center gap-2">
                    <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-sm transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        title="First Page"
                    >
                        <CaretDoubleLeft size={16} weight="light" />
                    </button>
                    <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-sm transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        title="Previous Page"
                    >
                        <CaretLeft size={16} weight="light" />
                    </button>
                    <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-sm transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        title="Next Page"
                    >
                        <CaretRight size={16} weight="light" />
                    </button>
                    <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-sm transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        title="Last Page"
                    >
                        <CaretDoubleRight size={16} weight="light" />
                    </button>
                </div>

                <div className="relative">
                    <select
                        className="appearance-none bg-transparent border-0 border-b border-gray-200 py-1 pr-6 pl-0 text-xs font-light text-gray-500 uppercase tracking-widest focus:ring-0 focus:border-gray-900 cursor-pointer"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                            table.setPageSize(Number(e.target.value));
                        }}
                    >
                        {[9, 18, 27, 36, 45].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))}
                    </select>
                    <CaretDown size={12} weight="light" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

        </div>
    );
};

export default Table;