"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  Target,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AISummaryGeneratorProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
}

interface AISummary {
  id: string
  overview: string
  keyInsights: string[]
  trends: {
    title: string
    description: string
    type: "positive" | "negative" | "neutral"
    confidence: number
  }[]
  anomalies: {
    title: string
    description: string
    severity: "low" | "medium" | "high"
    location: string
  }[]
  suggestions: {
    title: string
    description: string
    priority: "low" | "medium" | "high"
    category: string
  }[]
  statistics: {
    totalDataPoints: number
    completenessScore: number
    qualityScore: number
    diversityScore: number
  }
  generatedAt: string
}

export default function AISummaryGenerator({ data }: AISummaryGeneratorProps) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [analysisType, setAnalysisType] = useState<string>("comprehensive")
  const [customPrompt, setCustomPrompt] = useState("")
  const [savedSummaries, setSavedSummaries] = useState<AISummary[]>([])

  useEffect(() => {
    loadSavedSummaries()
  }, [])

  const loadSavedSummaries = async () => {
    try {
      const response = await fetch("/api/ai-summaries")
      if (response.ok) {
        const summaries = await response.json()
        setSavedSummaries(summaries)
      }
    } catch (error) {
      console.error("Failed to load saved summaries:", error)
    }
  }

  const generateSummary = async () => {
    setIsGenerating(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch("/api/generate-ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            headers: data.headers,
            data: data.data.slice(0, 100), // Limit data for API efficiency
            fileName: data.fileName,
            totalRows: data.totalRows,
          },
          analysisType,
          customPrompt: customPrompt.trim() || undefined,
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate AI summary")
      }

      const aiSummary = await response.json()
      setSummary(aiSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI summary")
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const saveSummary = async () => {
    if (!summary) return

    try {
      const response = await fetch("/api/ai-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...summary,
          dataSource: {
            fileName: data.fileName,
            headers: data.headers,
            totalRows: data.totalRows,
          },
        }),
      })

      if (response.ok) {
        const savedSummary = await response.json()
        setSavedSummaries((prev) => [savedSummary, ...prev])
      }
    } catch (error) {
      console.error("Failed to save summary:", error)
    }
  }

  const exportSummary = async () => {
    if (!summary) return

    try {
      const response = await fetch("/api/export-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          dataSource: {
            fileName: data.fileName,
            headers: data.headers,
            totalRows: data.totalRows,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const link = document.createElement("a")
        link.href = result.url
        link.download = `ai-summary-${data.fileName}.pdf`
        link.click()
      }
    } catch (error) {
      console.error("Failed to export summary:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTrendColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600 bg-green-50 border-green-200"
      case "negative":
        return "text-red-600 bg-red-50 border-red-200"
      case "neutral":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Zap className="h-4 w-4 text-red-500" />
      case "medium":
        return <Target className="h-4 w-4 text-orange-500" />
      case "low":
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <Lightbulb className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Summary Configuration */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Data Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate intelligent insights, identify trends, detect anomalies, and get actionable suggestions from your
            Excel data using advanced AI analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Comprehensive Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value="trends">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trend Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value="anomalies">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Anomaly Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Business Intelligence
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Analysis Prompt (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus on sales performance and customer behavior patterns..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={generateSummary}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Summary
                </>
              )}
            </Button>

            {summary && (
              <>
                <Button onClick={saveSummary} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Save Summary
                </Button>
                <Button onClick={exportSummary} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </>
            )}
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing your data with AI...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* AI Summary Results */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Overview */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Analysis Overview
                </CardTitle>
                <Badge variant="secondary" className="w-fit">
                  Generated {new Date(summary.generatedAt).toLocaleString()}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{summary.overview}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{summary.statistics.totalDataPoints}</div>
                    <div className="text-xs text-gray-600">Data Points</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{summary.statistics.completenessScore}%</div>
                    <div className="text-xs text-gray-600">Completeness</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{summary.statistics.qualityScore}%</div>
                    <div className="text-xs text-gray-600">Quality Score</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{summary.statistics.diversityScore}%</div>
                    <div className="text-xs text-gray-600">Diversity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summary.keyInsights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <p className="text-gray-700">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Identified Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summary.trends.map((trend, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-4 border rounded-lg ${getTrendColor(trend.type)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{trend.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {trend.confidence}% confidence
                              </Badge>
                              <Badge variant={trend.type === "positive" ? "default" : "secondary"} className="text-xs">
                                {trend.type}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm">{trend.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="anomalies" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Detected Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summary.anomalies.map((anomaly, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-4 border rounded-lg ${getSeverityColor(anomaly.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              {anomaly.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {anomaly.location}
                              </Badge>
                              <Badge
                                variant={anomaly.severity === "high" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {anomaly.severity} severity
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm">{anomaly.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summary.suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              {getPriorityIcon(suggestion.priority)}
                              {suggestion.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <Badge
                                variant={suggestion.priority === "high" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {suggestion.priority} priority
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion.description}</p>
                        </motion.div>
                      ))}
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
