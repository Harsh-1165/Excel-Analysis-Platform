"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Zap,
  Eye,
  Wand2,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Star,
  Target,
  Brain,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Chart2D from "@/components/chart-2d"
import dynamic from "next/dynamic"
const Chart3D = dynamic(() => import("@/components/chart-3d"), { ssr: false })
import type { ChartConfig, ChartType } from "./chart-generator"

interface SmartChartRecommenderProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
  onChartGenerated?: (config: ChartConfig) => void
}

interface ChartRecommendation {
  id: string
  type: ChartType
  title: string
  description: string
  xColumn: string
  yColumn: string
  confidence: number
  reasoning: string[]
  pros: string[]
  cons: string[]
  icon: any
  color: string
  gradient: string
  suitability: "excellent" | "good" | "fair"
  dataInsights: string[]
  config: ChartConfig
}

interface DataAnalysis {
  columnTypes: Record<string, "numerical" | "categorical" | "temporal" | "mixed">
  correlations: Record<string, number>
  distributions: Record<
    string,
    {
      mean?: number
      median?: number
      std?: number
      skewness?: number
      uniqueValues: number
      nullCount: number
      outliers: number
    }
  >
  patterns: {
    hasTimeColumn: boolean
    hasCategories: boolean
    hasNumerical: boolean
    strongCorrelations: Array<{ x: string; y: string; correlation: number }>
    trends: Array<{ column: string; trend: "increasing" | "decreasing" | "stable" | "cyclical" }>
  }
}

export default function SmartChartRecommender({ data, onChartGenerated }: SmartChartRecommenderProps) {
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([])
  const [dataAnalysis, setDataAnalysis] = useState<DataAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [generatedCharts, setGeneratedCharts] = useState<Record<string, any>>({})
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Analyze data and generate recommendations
  useEffect(() => {
    if (data.headers.length > 0 && data.data.length > 0) {
      analyzeDataAndGenerateRecommendations()
    }
  }, [data])

  const analyzeDataAndGenerateRecommendations = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/smart-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headers: data.headers,
          data: data.data.slice(0, 1000), // Limit for performance
          fileName: data.fileName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze data")
      }

      const result = await response.json()
      setDataAnalysis(result.analysis)
      setRecommendations(result.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze data")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateChart = async (recommendation: ChartRecommendation) => {
    setIsGenerating(recommendation.id)
    setError(null)

    try {
      // Generate chart data
      const chartData = data.data
        .filter((row) => {
          const xIndex = data.headers.indexOf(recommendation.xColumn)
          const yIndex = data.headers.indexOf(recommendation.yColumn)
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
          const xIndex = data.headers.indexOf(recommendation.xColumn)
          const yIndex = data.headers.indexOf(recommendation.yColumn)
          return {
            x: row[xIndex],
            y: row[yIndex],
          }
        })

      setGeneratedCharts((prev) => ({
        ...prev,
        [recommendation.id]: chartData,
      }))

      setSelectedRecommendation(recommendation.id)
      setSuccess(`${recommendation.title} generated successfully!`)
      setTimeout(() => setSuccess(null), 3000)

      // Save recommendation to database
      await fetch("/api/chart-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...recommendation,
          dataSource: {
            fileName: data.fileName,
            headers: data.headers,
            totalRows: data.totalRows,
          },
          generated: true,
        }),
      })

      if (onChartGenerated) {
        onChartGenerated(recommendation.config)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate chart")
    } finally {
      setIsGenerating(null)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600"
    if (confidence >= 70) return "text-blue-600"
    if (confidence >= 55) return "text-yellow-600"
    return "text-red-600"
  }

  const getSuitabilityBadge = (suitability: string) => {
    const variants = {
      excellent: "bg-green-100 text-green-800 border-green-200",
      good: "bg-blue-100 text-blue-800 border-blue-200",
      fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }
    return variants[suitability as keyof typeof variants] || variants.fair
  }

  const topRecommendations = recommendations.slice(0, 3)
  const otherRecommendations = recommendations.slice(3)

  if (isAnalyzing) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
            Analyzing Your Data...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="relative">
                <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Smart Analysis in Progress</h3>
                <p className="text-gray-600">
                  Examining data patterns, correlations, and optimal visualization strategies...
                </p>
              </div>
              <div className="space-y-2 max-w-md">
                <Progress value={33} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Analyzing data types</span>
                  <span>Detecting patterns</span>
                  <span>Generating recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Smart Chart Recommender
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  AI-powered chart suggestions based on your data patterns and characteristics
                </p>
              </div>
            </div>
            <Button onClick={analyzeDataAndGenerateRecommendations} variant="outline" size="sm" disabled={isAnalyzing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
              Re-analyze
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Data Insights */}
      {dataAnalysis && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Data Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Column Types</h4>
                <div className="space-y-1">
                  {Object.entries(dataAnalysis.columnTypes).map(([column, type]) => (
                    <div key={column} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-24">{column}</span>
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Strong Correlations</h4>
                <div className="space-y-1">
                  {dataAnalysis.patterns.strongCorrelations.slice(0, 3).map((corr, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 truncate max-w-20">
                          {corr.x} × {corr.y}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {(corr.correlation * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {dataAnalysis.patterns.strongCorrelations.length === 0 && (
                    <p className="text-xs text-gray-500">No strong correlations detected</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Data Patterns</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-3 w-3 ${dataAnalysis.patterns.hasTimeColumn ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className="text-xs">Time Series Data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-3 w-3 ${dataAnalysis.patterns.hasCategories ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className="text-xs">Categorical Data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-3 w-3 ${dataAnalysis.patterns.hasNumerical ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className="text-xs">Numerical Data</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Tabs defaultValue="top" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="top" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Top Recommendations ({topRecommendations.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              All Options ({recommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {topRecommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  index={index}
                  isGenerating={isGenerating === recommendation.id}
                  isSelected={selectedRecommendation === recommendation.id}
                  generatedChart={generatedCharts[recommendation.id]}
                  onGenerate={() => handleGenerateChart(recommendation)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  index={index}
                  isGenerating={isGenerating === recommendation.id}
                  isSelected={selectedRecommendation === recommendation.id}
                  generatedChart={generatedCharts[recommendation.id]}
                  onGenerate={() => handleGenerateChart(recommendation)}
                  compact
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Generated Chart Display */}
      {selectedRecommendation && generatedCharts[selectedRecommendation] && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Generated Chart Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const recommendation = recommendations.find((r) => r.id === selectedRecommendation)
                if (!recommendation) return null

                return recommendation.type === "3d-column" ? (
                  <Chart3D config={recommendation.config} data={generatedCharts[selectedRecommendation]} />
                ) : (
                  <Chart2D config={recommendation.config} data={generatedCharts[selectedRecommendation]} />
                )
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: ChartRecommendation
  index: number
  isGenerating: boolean
  isSelected: boolean
  generatedChart?: any
  onGenerate: () => void
  compact?: boolean
}

function RecommendationCard({
  recommendation,
  index,
  isGenerating,
  isSelected,
  generatedChart,
  onGenerate,
  compact = false,
}: RecommendationCardProps) {
  const IconComponent = recommendation.icon

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600"
    if (confidence >= 70) return "text-blue-600"
    if (confidence >= 55) return "text-yellow-600"
    return "text-red-600"
  }

  const getSuitabilityBadge = (suitability: string) => {
    const variants = {
      excellent: "bg-green-100 text-green-800 border-green-200",
      good: "bg-blue-100 text-blue-800 border-blue-200",
      fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }
    return variants[suitability as keyof typeof variants] || variants.fair
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={`
        shadow-lg border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl
        ${isSelected ? "ring-2 ring-purple-500 ring-opacity-50" : ""}
        ${recommendation.suitability === "excellent" ? "border-l-4 border-l-green-500" : ""}
        ${recommendation.suitability === "good" ? "border-l-4 border-l-blue-500" : ""}
        ${recommendation.suitability === "fair" ? "border-l-4 border-l-yellow-500" : ""}
      `}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${recommendation.gradient}`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getSuitabilityBadge(recommendation.suitability)}>{recommendation.suitability}</Badge>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${getConfidenceColor(recommendation.confidence)}`}>
                  {recommendation.confidence}%
                </span>
                <span className="text-xs text-gray-500">confidence</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Column Mapping */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-gray-700">X-Axis:</span>
              <span className="ml-2 text-gray-900">{recommendation.xColumn}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <span className="font-medium text-gray-700">Y-Axis:</span>
              <span className="ml-2 text-gray-900">{recommendation.yColumn}</span>
            </div>
          </div>

          {!compact && (
            <>
              {/* Reasoning */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Why this chart?</h4>
                <ul className="space-y-1">
                  {recommendation.reasoning.slice(0, 2).map((reason, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data Insights */}
              {recommendation.dataInsights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Data Insights</h4>
                  <div className="space-y-1">
                    {recommendation.dataInsights.slice(0, 2).map((insight, idx) => (
                      <div key={idx} className="text-xs text-blue-600 flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />
            </>
          )}

          {/* Action Button */}
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`w-full ${recommendation.gradient} hover:opacity-90 transition-all duration-300`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : generatedChart ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Generated Chart
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Chart
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
