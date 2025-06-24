"use client"

import { motion } from "framer-motion"
import { BarChart3, LineChart, PieChart, Box, Trash2, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ChartConfig } from "./chart-generator"

interface SavedChartsProps {
  charts: ChartConfig[]
  onLoadChart: (chart: ChartConfig) => void
  onDeleteChart: (chartId: string) => void
}

export default function SavedCharts({ charts, onLoadChart, onDeleteChart }: SavedChartsProps) {
  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChart3 className="h-4 w-4" />
      case "line":
        return <LineChart className="h-4 w-4" />
      case "pie":
        return <PieChart className="h-4 w-4" />
      case "3d-column":
        return <Box className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getChartTypeLabel = (type: string) => {
    switch (type) {
      case "bar":
        return "Bar Chart"
      case "line":
        return "Line Chart"
      case "pie":
        return "Pie Chart"
      case "3d-column":
        return "3D Column"
      default:
        return "Chart"
    }
  }

  if (charts.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-16 w-16" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Saved Charts</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Create and save your first chart to see it here. Saved charts can be loaded and modified anytime.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {charts.map((chart, index) => (
        <motion.div
          key={chart.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getChartIcon(chart.type)}
                  {chart.name || "Untitled Chart"}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {getChartTypeLabel(chart.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">X-Axis:</span>
                  <span className="font-medium">{chart.xColumn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Y-Axis:</span>
                  <span className="font-medium">{chart.yColumn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium truncate ml-2">{chart.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  onClick={() => onLoadChart(chart)}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Load
                </Button>
                <Button
                  onClick={() => chart.id && onDeleteChart(chart.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
