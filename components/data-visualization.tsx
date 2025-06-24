"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, BarChart3, ScatterChartIcon as ScatterIcon } from "lucide-react"

interface DataVisualizationProps {
  mappedData: {
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
}

export default function DataVisualization({ mappedData }: DataVisualizationProps) {
  // Prepare data for visualization
  const chartData = useMemo(() => {
    return mappedData.mappedData
      .filter((item) => item.x !== null && item.x !== undefined && item.y !== null && item.y !== undefined)
      .map((item) => ({
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        xOriginal: item.x,
        yOriginal: item.y,
      }))
      .slice(0, 1000) // Limit for performance
  }, [mappedData])

  // Determine if data is numeric for both axes
  const isNumericData =
    mappedData.statistics.xStats.type === "numeric" && mappedData.statistics.yStats.type === "numeric"

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{`${mappedData.xColumn}: ${payload[0]?.payload?.xOriginal}`}</p>
          <p className="font-semibold">{`${mappedData.yColumn}: ${payload[0]?.payload?.yOriginal}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Chart Selection Info */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Data Visualization
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isNumericData ? "default" : "secondary"}>
                {isNumericData ? "Numeric Data" : "Mixed Data Types"}
              </Badge>
              <Badge variant="outline">{chartData.length} points</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Visualizations */}
      <div className="grid gap-6">
        {isNumericData ? (
          <>
            {/* Scatter Plot */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScatterIcon className="h-5 w-5 text-purple-600" />
                    Scatter Plot
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Visualize the relationship between {mappedData.xColumn} and {mappedData.yColumn}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="x" name={mappedData.xColumn} stroke="#666" fontSize={12} />
                        <YAxis dataKey="y" name={mappedData.yColumn} stroke="#666" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter dataKey="y" fill="#8b5cf6" fillOpacity={0.6} stroke="#7c3aed" strokeWidth={1} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Trend Line
                  </CardTitle>
                  <p className="text-sm text-gray-600">Data points connected to show trends over the sequence</p>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.slice(0, 100)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="x" name={mappedData.xColumn} stroke="#666" fontSize={12} />
                        <YAxis dataKey="y" name={mappedData.yColumn} stroke="#666" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="y"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {chartData.length > 100 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Showing first 100 data points for better visualization
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          /* Bar Chart for non-numeric data */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Data Distribution
                </CardTitle>
                <p className="text-sm text-gray-600">Distribution of values for mixed data types</p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(0, 50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="xOriginal" stroke="#666" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="y" fill="#10b981" fillOpacity={0.8} stroke="#059669" strokeWidth={1} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {chartData.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing first 50 data points for better visualization
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Data Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Data Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">{mappedData.xColumn} (X-Axis)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data Type:</span>
                      <Badge variant="outline">{mappedData.statistics.xStats.type}</Badge>
                    </div>
                    {mappedData.statistics.xStats.type === "numeric" && (
                      <>
                        <div className="flex justify-between">
                          <span>Minimum:</span>
                          <span className="font-mono">{mappedData.statistics.xStats.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maximum:</span>
                          <span className="font-mono">{mappedData.statistics.xStats.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-mono">{mappedData.statistics.xStats.avg.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">{mappedData.yColumn} (Y-Axis)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data Type:</span>
                      <Badge variant="outline">{mappedData.statistics.yStats.type}</Badge>
                    </div>
                    {mappedData.statistics.yStats.type === "numeric" && (
                      <>
                        <div className="flex justify-between">
                          <span>Minimum:</span>
                          <span className="font-mono">{mappedData.statistics.yStats.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maximum:</span>
                          <span className="font-mono">{mappedData.statistics.yStats.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-mono">{mappedData.statistics.yStats.avg.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {mappedData.statistics.correlation !== null && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-700">Statistical Correlation</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Pearson correlation coefficient between the two variables
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {mappedData.statistics.correlation.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.abs(mappedData.statistics.correlation) > 0.7
                          ? "Strong"
                          : Math.abs(mappedData.statistics.correlation) > 0.3
                            ? "Moderate"
                            : "Weak"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
