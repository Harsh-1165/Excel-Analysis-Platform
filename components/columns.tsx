"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This function generates columns dynamically based on the data structure
export function generateColumns(data: any[]): ColumnDef<any>[] {
  if (!data || data.length === 0) {
    return []
  }

  // Get all unique keys from the data
  const allKeys = new Set<string>()
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key))
  })

  const columns: ColumnDef<any>[] = Array.from(allKeys).map((key) => ({
    accessorKey: key,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {key}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue(key)
      return (
        <div className="font-medium">
          {value !== null && value !== undefined ? String(value) : '-'}
        </div>
      )
    },
  }))

  // Add actions column
  columns.push({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const record = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(JSON.stringify(record))}
            >
              Copy record
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit record</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  })

  return columns
}

// Default columns for when no data is available
export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => <div className="font-medium">{row.getValue("value")}</div>,
  },
] 