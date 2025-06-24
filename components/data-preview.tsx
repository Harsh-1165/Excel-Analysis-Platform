"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Search, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataPreviewProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
}

export default function DataPreview({ data }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data.data]

    // Apply search filter
    if (searchTerm) {
      processedData = processedData.filter((row) =>
        row.some((cell) => cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortColumn !== null) {
      processedData.sort((a, b) => {
        const aVal = a[sortColumn]?.toString() || ""
        const bVal = b[sortColumn]?.toString() || ""

        const comparison = aVal.localeCompare(bVal, undefined, { numeric: true })
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return processedData
  }, [data.data, searchTerm, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnIndex)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const exportData = () => {
    const csvContent = [data.headers.join(","), ...filteredAndSortedData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.fileName.replace(/\.[^/.]+$/, "")}_filtered.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Data Preview
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {filteredAndSortedData.length} of {data.totalRows} rows
              </Badge>
              {searchTerm && <Badge variant="secondary">Filtered by: "{searchTerm}"</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 rows</SelectItem>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {data.headers.map((header, index) => (
                    <TableHead
                      key={index}
                      className="font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort(index)}
                    >
                      <div className="flex items-center gap-2">
                        {header}
                        {sortColumn === index && (
                          <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row, rowIndex) => (
                  <motion.tr
                    key={startIndex + rowIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="max-w-xs truncate">
                        {cell?.toString() || ""}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedData.length)} of{" "}
              {filteredAndSortedData.length} entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
