"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { BarChart3, LineChart, PieChart, Box, Save, RefreshCw, Settings, ImageIcon, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Chart2D from "@/components/chart-2d"
import dynamic from "next/dynamic"
const Chart3D = dynamic(() => import("@/components/chart-3d"), { ssr: false })
import SavedCharts from "@/components/saved-charts"

interface ChartGeneratorProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
}

export type ChartType = "bar" | "line" | "pie" | "3d-column"

export interface ChartConfig {
  id?: string
  name: string
  type: ChartType
  xColumn: string
  yColumn: string
  title: string
  xAxisLabel: string
  yAxisLabel: string
  colors: string[]
  backgroundColor: string
  showLegend: boolean
  showGrid: boolean
  animation: boolean
}

export default function ChartGenerator({ data }: ChartGeneratorProps) {
  const [xColumn, setXColumn] = useState<string>("")
  const [yColumn, setYColumn] = useState<string>("")
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    name: "",
    type: "bar",
    xColumn: "",
    yColumn: "",
    title: "My Chart",
    xAxisLabel: "X Axis",
    yAxisLabel: "Y Axis",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
    backgroundColor: "#ffffff",
    showLegend: true,
    showGrid: true,
    animation: true,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savedCharts, setSavedCharts] = useState<ChartConfig[]>([])

  const chartRef = useRef<HTMLDivElement>(null)

  // Load saved charts on mount
  useEffect(() => {
    loadSavedCharts()
  }, [])

  // Set default columns
  useEffect(() => {
    if (data.headers.length >= 2) {
      const firstCol = data.headers[0]
      const secondCol = data.headers[1]
      setXColumn(firstCol)
      setYColumn(secondCol)
      setChartConfig((prev) => ({
        ...prev,
        xColumn: firstCol,
        yColumn: secondCol,
        xAxisLabel: firstCol,
        yAxisLabel: secondCol,
      }))
    }
  }, [data.headers])

  const loadSavedCharts = async () => {
    try {
      const response = await fetch("/api/charts")
      if (response.ok) {
        const charts = await response.json()
        setSavedCharts(charts)
      }
    } catch (error) {
      console.error("Failed to load saved charts:", error)
    }
  }

  const handleGenerateChart = () => {
    if (!xColumn || !yColumn) {
      setError("Please select both X and Y columns")
      return
    }

    if (xColumn === yColumn) {
      setError("X and Y columns must be different")
      return
    }

    setIsGenerating(true)
    setError(null)

    // Update chart config
    setChartConfig((prev) => ({
      ...prev,
      type: chartType,
      xColumn,
      yColumn,
      xAxisLabel: prev.xAxisLabel || xColumn,
      yAxisLabel: prev.yAxisLabel || yColumn,
    }))

    setTimeout(() => {
      setIsGenerating(false)
    }, 1000)
  }

  const handleSaveChart = async () => {
    if (!chartConfig.name.trim()) {
      setError("Please enter a chart name")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/charts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...chartConfig,
          dataSource: {
            fileName: data.fileName,
            headers: data.headers,
            totalRows: data.totalRows,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save chart")
      }

      const savedChart = await response.json()
      setSavedCharts((prev) => [...prev, savedChart])
      setSuccess("Chart saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save chart")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportChart = async (format: "png" | "pdf") => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch("/api/export-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chartConfig,
          data: {
            headers: data.headers,
            data: data.data,
          },
          format,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Export failed")
      }

      const result = await response.json()

      // Download the file
      const link = document.createElement("a")
      link.href = result.url
      link.download = `${chartConfig.name || "chart"}.${format}`
      link.click()

      setSuccess(`Chart exported as ${format.toUpperCase()} successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  const handleLoadChart = (chart: ChartConfig) => {
    setChartConfig(chart)
    setXColumn(chart.xColumn)
    setYColumn(chart.yColumn)
    setChartType(chart.type)
  }

  const handleDeleteChart = async (chartId: string) => {
    try {
      const response = await fetch(`/api/charts/${chartId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSavedCharts((prev) => prev.filter((chart) => chart.id !== chartId))
        setSuccess("Chart deleted successfully!")
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      setError("Failed to delete chart")
    }
  }

  const chartData = data.data
    .filter((row) => {
      const xIndex = data.headers.indexOf(xColumn)
      const yIndex = data.headers.indexOf(yColumn)
      return (
        row[xIndex] !== null &&
        row[xIndex] !== undefined &&
        row[xIndex] !== "" &&
        row[yIndex] !== null &&
        row[yIndex] !== undefined &&
        row[yIndex] !== ""
      )
    })
    .map((row) => {
      const xIndex = data.headers.indexOf(xColumn)
      const yIndex = data.headers.indexOf(yColumn)
      return {
        x: row[xIndex],
        y: row[yIndex],
      }
    })

  return (
    <div className="space-y-6">
      {/* Chart Configuration */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Chart Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create beautiful charts from your Excel data with advanced customization options.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>X-Axis Column</Label>
              <Select value={xColumn} onValueChange={setXColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select X column..." />
                </SelectTrigger>
                <SelectContent>
                  {data.headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Y-Axis Column</Label>
              <Select value={yColumn} onValueChange={setYColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y column..." />
                </SelectTrigger>
                <SelectContent>
                  {data.headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Pie Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="3d-column">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      3D Column
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chart Name</Label>
              <Input
                value={chartConfig.name}
                onChange={(e) => setChartConfig((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter chart name..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleGenerateChart}
              disabled={!xColumn || !yColumn || xColumn === yColumn || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PieChart className="h-4 w-4 mr-2" />
                  Generate Chart
                </>
              )}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chart Customization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                      value={chartConfig.title}
                      onChange={(e) => setChartConfig((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>X-Axis Label</Label>
                    <Input
                      value={chartConfig.xAxisLabel}
                      onChange={(e) => setChartConfig((prev) => ({ ...prev, xAxisLabel: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y-Axis Label</Label>
                    <Input
                      value={chartConfig.yAxisLabel}
                      onChange={(e) => setChartConfig((prev) => ({ ...prev, yAxisLabel: e.target.value }))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSaveChart} disabled={isSaving || !chartConfig.name.trim()} variant="outline">
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Chart
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button onClick={() => handleExportChart("png")} disabled={isExporting} variant="outline" size="sm">
                {isExporting ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ImageIcon className="h-3 w-3 mr-1" />
                )}
                PNG
              </Button>
              <Button onClick={() => handleExportChart("pdf")} disabled={isExporting} variant="outline" size="sm">
                {isExporting ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3 mr-1" />
                )}
                PDF
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Chart Display */}
      {xColumn && yColumn && xColumn !== yColumn && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="chart">Generated Chart</TabsTrigger>
            <TabsTrigger value="saved">Saved Charts ({savedCharts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              ref={chartRef}
            >
              {chartType === "3d-column" ? (
                <Chart3D config={chartConfig} data={chartData} />
              ) : (
                <Chart2D config={chartConfig} data={chartData} />
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedCharts charts={savedCharts} onLoadChart={handleLoadChart} onDeleteChart={handleDeleteChart} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
