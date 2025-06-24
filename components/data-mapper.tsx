"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  ScatterChartIcon as Scatter,
  LineChart,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DataVisualization from "@/components/data-visualization"

interface DataMapperProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
}

interface MappedData {
  xColumn: string
  yColumn: string
  mappedData: Array<{ x: any; y: any; originalIndex: number }>
  statistics: {
    xStats: { min: number; max: number; avg: number; type: string }
    yStats: { min: number; max: number; avg: number; type: string }
    correlation: number | null
    validPairs: number
    totalPairs: number
  }
}

export default function DataMapper({ data }: DataMapperProps) {
  const [xColumn, setXColumn] = useState<string>("")
  const [yColumn, setYColumn] = useState<string>("")
  const [mappedData, setMappedData] = useState<MappedData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get numeric columns for better default selection
  const numericColumns = useMemo(() => {
    const numeric: string[] = []
    const nonNumeric: string[] = []

    data.headers.forEach((header, index) => {
      const sampleValues = data.data.slice(0, 10).map((row) => row[index])
      const numericCount = sampleValues.filter(
        (val) => val !== null && val !== undefined && val !== "" && !isNaN(Number(val)),
      ).length

      if (numericCount > sampleValues.length * 0.7) {
        numeric.push(header)
      } else {
        nonNumeric.push(header)
      }
    })

    return { numeric, nonNumeric, all: [...numeric, ...nonNumeric] }
  }, [data])

  // Set default columns on mount
  useEffect(() => {
    if (numericColumns.numeric.length >= 2) {
      setXColumn(numericColumns.numeric[0])
      setYColumn(numericColumns.numeric[1])
    } else if (data.headers.length >= 2) {
      setXColumn(data.headers[0])
      setYColumn(data.headers[1])
    }
  }, [numericColumns, data.headers])

  const handleMapData = async () => {
    if (!xColumn || !yColumn) {
      setError("Please select both X and Y columns")
      return
    }

    if (xColumn === yColumn) {
      setError("X and Y columns must be different")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/map-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headers: data.headers,
          data: data.data,
          xColumn,
          yColumn,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Mapping failed")
      }

      const result = await response.json()
      setMappedData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-map when columns change
  useEffect(() => {
    if (xColumn && yColumn && xColumn !== yColumn) {
      handleMapData()
    }
  }, [xColumn, yColumn])

  const exportMappedData = () => {
    if (!mappedData) return

    const csvContent = [
      `${mappedData.xColumn},${mappedData.yColumn}`,
      ...mappedData.mappedData.map((item) => `${item.x},${item.y}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mapped_data_${mappedData.xColumn}_vs_${mappedData.yColumn}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Column Selection */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Dynamic Data Mapper
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select any two columns to create X-Y axis mapping and visualize relationships in your data.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-700">X-Axis Column</label>
              <Select value={xColumn} onValueChange={setXColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select X column..." />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.numeric.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Numeric Columns (Recommended)
                      </div>
                      {numericColumns.numeric.map((header) => (
                        <SelectItem key={header} value={header}>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            {header}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {numericColumns.nonNumeric.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Other Columns
                      </div>
                      {numericColumns.nonNumeric.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-700">Y-Axis Column</label>
              <Select value={yColumn} onValueChange={setYColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Y column..." />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.numeric.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Numeric Columns (Recommended)
                      </div>
                      {numericColumns.numeric.map((header) => (
                        <SelectItem key={header} value={header}>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            {header}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {numericColumns.nonNumeric.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Other Columns
                      </div>
                      {numericColumns.nonNumeric.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleMapData}
              disabled={!xColumn || !yColumn || xColumn === yColumn || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Mapping Data...
                </>
              ) : (
                <>
                  <Scatter className="h-4 w-4 mr-2" />
                  Map Data
                </>
              )}
            </Button>

            {mappedData && (
              <Button onClick={exportMappedData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Mapped Data
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {mappedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Statistics */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Mapping Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {mappedData.statistics.validPairs.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Valid Data Points</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {((mappedData.statistics.validPairs / mappedData.statistics.totalPairs) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Data Completeness</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{mappedData.statistics.xStats.type}</div>
                    <div className="text-sm text-gray-600">X-Axis Data Type</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{mappedData.statistics.yStats.type}</div>
                    <div className="text-sm text-gray-600">Y-Axis Data Type</div>
                  </div>
                </div>

                {mappedData.statistics.correlation !== null && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Correlation Coefficient:</span>
                      <Badge variant={Math.abs(mappedData.statistics.correlation) > 0.7 ? "default" : "secondary"}>
                        {mappedData.statistics.correlation.toFixed(3)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Math.abs(mappedData.statistics.correlation) > 0.7
                        ? "Strong correlation detected"
                        : Math.abs(mappedData.statistics.correlation) > 0.3
                          ? "Moderate correlation detected"
                          : "Weak correlation detected"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visualization and Data Preview */}
            <Tabs defaultValue="visualization" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
                <TabsTrigger value="visualization" className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Visualization
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Mapped Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visualization" className="mt-6">
                <DataVisualization mappedData={mappedData} />
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Mapped Data Preview</CardTitle>
                    <p className="text-sm text-gray-600">
                      Showing mapped values for {mappedData.xColumn} (X) vs {mappedData.yColumn} (Y)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">{mappedData.xColumn} (X)</TableHead>
                              <TableHead className="font-semibold">{mappedData.yColumn} (Y)</TableHead>
                              <TableHead className="font-semibold">Row Index</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mappedData.mappedData.slice(0, 100).map((item, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell>{item.x?.toString() || "N/A"}</TableCell>
                                <TableCell>{item.y?.toString() || "N/A"}</TableCell>
                                <TableCell className="text-gray-500">{item.originalIndex + 1}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {mappedData.mappedData.length > 100 && (
                        <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                          Showing first 100 of {mappedData.mappedData.length} mapped data points
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
