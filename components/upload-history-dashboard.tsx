"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  History,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Box,
  Brain,
  Search,
  Trash2,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  Database,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadRecord {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  uploadDate: string
  totalRows: number
  totalColumns: number
  sheetName: string
  headers: string[]
  data: any[][]
  status: "completed" | "processing" | "failed"
  chartsGenerated: {
    id: string
    name: string
    type: "bar" | "line" | "pie" | "3d-column"
    createdAt: string
  }[]
  aiSummariesGenerated: {
    id: string
    analysisType: string
    createdAt: string
  }[]
  lastAccessed: string
  processingTime: number
}

interface UploadHistoryDashboardProps {
  onLoadFile: (data: any) => void
}

export default function UploadHistoryDashboard({ onLoadFile }: UploadHistoryDashboardProps) {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [filteredUploads, setFilteredUploads] = useState<UploadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null)

  useEffect(() => {
    loadUploadHistory()
  }, [])

  useEffect(() => {
    filterUploads()
  }, [uploads, searchTerm, statusFilter, dateFilter])

  const loadUploadHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/upload-history")
      if (!response.ok) {
        throw new Error("Failed to load upload history")
      }

      const data = await response.json()
      setUploads(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load upload history")
    } finally {
      setIsLoading(false)
    }
  }

  const filterUploads = () => {
    let filtered = [...uploads]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (upload) =>
          upload.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          upload.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          upload.sheetName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((upload) => upload.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter((upload) => new Date(upload.uploadDate) >= filterDate)
      }
    }

    setFilteredUploads(filtered)
    setCurrentPage(1)
  }

  const handleDelete = async (uploadId: string) => {
    setIsDeleting(uploadId)

    try {
      const response = await fetch(`/api/upload-history/${uploadId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete upload")
      }

      setUploads((prev) => prev.filter((upload) => upload.id !== uploadId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete upload")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleReanalyze = async (uploadId: string) => {
    setIsReanalyzing(uploadId)

    try {
      const response = await fetch(`/api/reanalyze/${uploadId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reanalyze file")
      }

      const result = await response.json()
      onLoadFile(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reanalyze file")
    } finally {
      setIsReanalyzing(null)
    }
  }

  const handleLoadFile = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/upload-history/${uploadId}`)
      if (!response.ok) {
        throw new Error("Failed to load file data")
      }

      const uploadData = await response.json()
      onLoadFile({
        headers: uploadData.headers,
        data: uploadData.data,
        fileName: uploadData.fileName,
        sheetName: uploadData.sheetName,
        totalRows: uploadData.totalRows,
        uploadId: uploadData.id,
      })

      // Update last accessed
      await fetch(`/api/upload-history/${uploadId}/access`, {
        method: "POST",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChart3 className="h-3 w-3" />
      case "line":
        return <LineChart className="h-3 w-3" />
      case "pie":
        return <PieChart className="h-3 w-3" />
      case "3d-column":
        return <Box className="h-3 w-3" />
      default:
        return <BarChart3 className="h-3 w-3" />
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredUploads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUploads = filteredUploads.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <div className="font-semibold">Loading Upload History</div>
              <div className="text-sm text-gray-600">Please wait...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Upload History Dashboard
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track all your Excel file uploads, charts, and AI analyses
              </p>
            </div>
            <Button onClick={loadUploadHistory} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Uploads</p>
                  <p className="text-2xl font-bold text-blue-900">{uploads.length}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Charts Generated</p>
                  <p className="text-2xl font-bold text-green-900">
                    {uploads.reduce((sum, upload) => sum + upload.chartsGenerated.length, 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">AI Summaries</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {uploads.reduce((sum, upload) => sum + upload.aiSummariesGenerated.length, 0)}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Data Points</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {uploads.reduce((sum, upload) => sum + upload.totalRows, 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files by name or sheet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload History Table */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {currentUploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Upload History Found</h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "No uploads match your current filters. Try adjusting your search criteria."
                  : "Upload your first Excel file to see it appear in your history."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">File Details</TableHead>
                      <TableHead className="font-semibold">Upload Info</TableHead>
                      <TableHead className="font-semibold">Data Summary</TableHead>
                      <TableHead className="font-semibold">Generated Content</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUploads.map((upload, index) => (
                      <motion.tr
                        key={upload.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-sm">{upload.originalName}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(upload.fileSize)} • Sheet: {upload.sheetName}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(upload.uploadDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Last accessed: {formatDate(upload.lastAccessed)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {upload.totalRows.toLocaleString()} rows × {upload.totalColumns} cols
                            </div>
                            <div className="text-xs text-gray-500">Processed in {upload.processingTime}ms</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {upload.chartsGenerated.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs text-gray-600">Charts:</span>
                                {upload.chartsGenerated.slice(0, 3).map((chart) => (
                                  <Badge key={chart.id} variant="outline" className="text-xs px-1 py-0">
                                    {getChartIcon(chart.type)}
                                    <span className="ml-1">{chart.type}</span>
                                  </Badge>
                                ))}
                                {upload.chartsGenerated.length > 3 && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    +{upload.chartsGenerated.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {upload.aiSummariesGenerated.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-3 w-3 text-purple-600" />
                                <span className="text-xs text-gray-600">
                                  {upload.aiSummariesGenerated.length} AI summaries
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(upload.status)}`}>{upload.status}</Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleLoadFile(upload.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Load
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedUpload(upload)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReanalyze(upload.id)}
                                  disabled={isReanalyzing === upload.id}
                                >
                                  {isReanalyzing === upload.id ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                  )}
                                  Reanalyze
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(upload.id)}
                                  disabled={isDeleting === upload.id}
                                  className="text-red-600"
                                >
                                  {isDeleting === upload.id ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUploads.length)} of {filteredUploads.length}{" "}
                    uploads
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Details Modal */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Upload Details: {selectedUpload?.originalName}
            </DialogTitle>
          </DialogHeader>

          {selectedUpload && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">File Size</div>
                  <div className="text-lg font-semibold">{formatFileSize(selectedUpload.fileSize)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Upload Date</div>
                  <div className="text-lg font-semibold">{formatDate(selectedUpload.uploadDate)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Total Rows</div>
                  <div className="text-lg font-semibold">{selectedUpload.totalRows.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Columns</div>
                  <div className="text-lg font-semibold">{selectedUpload.totalColumns}</div>
                </div>
              </div>

              {/* Column Headers */}
              <div>
                <h4 className="font-semibold mb-3">Column Headers</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUpload.headers.map((header, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Generated Charts */}
              {selectedUpload.chartsGenerated.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Generated Charts ({selectedUpload.chartsGenerated.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedUpload.chartsGenerated.map((chart) => (
                      <div key={chart.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {getChartIcon(chart.type)}
                          <span className="font-medium text-sm">{chart.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">Created: {formatDate(chart.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summaries */}
              {selectedUpload.aiSummariesGenerated.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">AI Summaries ({selectedUpload.aiSummariesGenerated.length})</h4>
                  <div className="space-y-2">
                    {selectedUpload.aiSummariesGenerated.map((summary) => (
                      <div key={summary.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm capitalize">{summary.analysisType} Analysis</span>
                        </div>
                        <div className="text-xs text-gray-500">Created: {formatDate(summary.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
