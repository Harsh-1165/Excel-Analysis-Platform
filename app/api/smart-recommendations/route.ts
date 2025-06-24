import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

interface DataPoint {
  [key: string]: any
}

interface ColumnAnalysis {
  type: "numerical" | "categorical" | "temporal" | "mixed"
  uniqueValues: number
  nullCount: number
  mean?: number
  median?: number
  std?: number
  skewness?: number
  outliers: number
  distribution: "normal" | "skewed" | "uniform" | "bimodal" | "unknown"
  trend?: "increasing" | "decreasing" | "stable" | "cyclical"
}

interface ChartRecommendation {
  id: string
  type: "bar" | "line" | "pie" | "scatter" | "3d-column"
  title: string
  description: string
  xColumn: string
  yColumn: string
  confidence: number
  reasoning: string[]
  pros: string[]
  cons: string[]
  icon: string
  color: string
  gradient: string
  suitability: "excellent" | "good" | "fair"
  dataInsights: string[]
  config: any
}

export async function POST(request: NextRequest) {
  try {
    const { headers, data, fileName } = await request.json()

    if (!headers || !data || headers.length < 2) {
      return NextResponse.json({ error: "Insufficient data for analysis" }, { status: 400 })
    }

    // Analyze each column
    const columnAnalyses: Record<string, ColumnAnalysis> = {}
    const correlations: Record<string, number> = {}

    for (const header of headers) {
      columnAnalyses[header] = analyzeColumn(data, headers.indexOf(header))
    }

    // Calculate correlations between numerical columns
    const numericalColumns = Object.entries(columnAnalyses)
      .filter(([_, analysis]) => analysis.type === "numerical")
      .map(([column]) => column)

    for (let i = 0; i < numericalColumns.length; i++) {
      for (let j = i + 1; j < numericalColumns.length; j++) {
        const col1 = numericalColumns[i]
        const col2 = numericalColumns[j]
        const correlation = calculateCorrelation(data, headers.indexOf(col1), headers.indexOf(col2))
        correlations[`${col1}_${col2}`] = correlation
      }
    }

    // Detect patterns
    const patterns = detectPatterns(columnAnalyses, correlations)

    // Generate recommendations
    const recommendations = generateRecommendations(headers, columnAnalyses, correlations, patterns, fileName)

    // Sort by confidence score
    recommendations.sort((a, b) => b.confidence - a.confidence)

    const analysis = {
      columnTypes: Object.fromEntries(Object.entries(columnAnalyses).map(([col, analysis]) => [col, analysis.type])),
      correlations,
      distributions: Object.fromEntries(
        Object.entries(columnAnalyses).map(([col, analysis]) => [
          col,
          {
            mean: analysis.mean,
            median: analysis.median,
            std: analysis.std,
            skewness: analysis.skewness,
            uniqueValues: analysis.uniqueValues,
            nullCount: analysis.nullCount,
            outliers: analysis.outliers,
          },
        ]),
      ),
      patterns,
    }

    return NextResponse.json({
      analysis,
      recommendations: recommendations.slice(0, 8), // Return top 8 recommendations
    })
  } catch (error) {
    console.error("Smart recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

function analyzeColumn(data: any[][], columnIndex: number): ColumnAnalysis {
  const values = data.map((row) => row[columnIndex]).filter((val) => val !== null && val !== undefined && val !== "")

  if (values.length === 0) {
    return {
      type: "mixed",
      uniqueValues: 0,
      nullCount: data.length,
      outliers: 0,
      distribution: "unknown",
    }
  }

  const uniqueValues = new Set(values).size
  const nullCount = data.length - values.length

  // Detect data type
  const numericValues = values.filter((val) => !isNaN(Number(val)) && val !== "").map((val) => Number(val))
  const numericRatio = numericValues.length / values.length

  let type: ColumnAnalysis["type"]
  let mean: number | undefined
  let median: number | undefined
  let std: number | undefined
  let skewness: number | undefined
  let outliers = 0
  let distribution: ColumnAnalysis["distribution"] = "unknown"

  if (numericRatio > 0.8) {
    type = "numerical"

    // Calculate statistics
    mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length

    const sortedValues = [...numericValues].sort((a, b) => a - b)
    median =
      sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)]

    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
    std = Math.sqrt(variance)

    // Calculate skewness
    if (std > 0) {
      skewness = numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / numericValues.length
    }

    // Detect outliers using IQR method
    const q1Index = Math.floor(sortedValues.length * 0.25)
    const q3Index = Math.floor(sortedValues.length * 0.75)
    const q1 = sortedValues[q1Index]
    const q3 = sortedValues[q3Index]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    outliers = numericValues.filter((val) => val < lowerBound || val > upperBound).length

    // Determine distribution
    if (Math.abs(skewness || 0) < 0.5) {
      distribution = "normal"
    } else if (Math.abs(skewness || 0) > 1) {
      distribution = "skewed"
    } else {
      distribution = "uniform"
    }
  } else if (isTemporalColumn(values)) {
    type = "temporal"
  } else if (uniqueValues / values.length < 0.5) {
    type = "categorical"
  } else {
    type = "mixed"
  }

  return {
    type,
    uniqueValues,
    nullCount,
    mean,
    median,
    std,
    skewness,
    outliers,
    distribution,
  }
}

function isTemporalColumn(values: any[]): boolean {
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
  ]

  const sampleSize = Math.min(10, values.length)
  const sample = values.slice(0, sampleSize)

  const dateCount = sample.filter((val) => {
    const str = val.toString()
    return datePatterns.some((pattern) => pattern.test(str)) || !isNaN(Date.parse(str))
  }).length

  return dateCount / sampleSize > 0.7
}

function calculateCorrelation(data: any[][], col1Index: number, col2Index: number): number {
  const pairs = data
    .map((row) => [Number(row[col1Index]), Number(row[col2Index])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y))

  if (pairs.length < 2) return 0

  const n = pairs.length
  const sumX = pairs.reduce((sum, [x]) => sum + x, 0)
  const sumY = pairs.reduce((sum, [, y]) => sum + y, 0)
  const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0)
  const sumXX = pairs.reduce((sum, [x]) => sum + x * x, 0)
  const sumYY = pairs.reduce((sum, [, y]) => sum + y * y, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

function detectPatterns(columnAnalyses: Record<string, ColumnAnalysis>, correlations: Record<string, number>) {
  const hasTimeColumn = Object.values(columnAnalyses).some((analysis) => analysis.type === "temporal")
  const hasCategories = Object.values(columnAnalyses).some((analysis) => analysis.type === "categorical")
  const hasNumerical = Object.values(columnAnalyses).some((analysis) => analysis.type === "numerical")

  const strongCorrelations = Object.entries(correlations)
    .filter(([, correlation]) => Math.abs(correlation) > 0.5)
    .map(([key, correlation]) => {
      const [x, y] = key.split("_")
      return { x, y, correlation }
    })

  const trends = Object.entries(columnAnalyses)
    .filter(([, analysis]) => analysis.trend)
    .map(([column, analysis]) => ({ column, trend: analysis.trend! }))

  return {
    hasTimeColumn,
    hasCategories,
    hasNumerical,
    strongCorrelations,
    trends,
  }
}

function generateRecommendations(
  headers: string[],
  columnAnalyses: Record<string, ColumnAnalysis>,
  correlations: Record<string, number>,
  patterns: any,
  fileName: string,
): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = []

  // Generate all possible column combinations
  for (let i = 0; i < headers.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      if (i === j) continue

      const xColumn = headers[i]
      const yColumn = headers[j]
      const xAnalysis = columnAnalyses[xColumn]
      const yAnalysis = columnAnalyses[yColumn]

      // Generate recommendations based on data types
      const chartRecommendations = getChartRecommendationsForColumns(
        xColumn,
        yColumn,
        xAnalysis,
        yAnalysis,
        correlations,
        patterns,
      )

      recommendations.push(
        ...chartRecommendations.map((rec) => ({
          ...rec,
          id: nanoid(),
          config: {
            id: nanoid(),
            name: rec.title,
            type: rec.type,
            xColumn,
            yColumn,
            title: rec.title,
            xAxisLabel: xColumn,
            yAxisLabel: yColumn,
            colors: getColorsForChart(rec.type),
            backgroundColor: "#ffffff",
            showLegend: true,
            showGrid: true,
            animation: true,
          },
        })),
      )
    }
  }

  // Remove duplicates and limit results
  const uniqueRecommendations = recommendations.filter(
    (rec, index, self) =>
      index === self.findIndex((r) => r.type === rec.type && r.xColumn === rec.xColumn && r.yColumn === rec.yColumn),
  )

  return uniqueRecommendations
}

function getChartRecommendationsForColumns(
  xColumn: string,
  yColumn: string,
  xAnalysis: ColumnAnalysis,
  yAnalysis: ColumnAnalysis,
  correlations: Record<string, number>,
  patterns: any,
): Omit<ChartRecommendation, "id" | "config">[] {
  const recommendations: Omit<ChartRecommendation, "id" | "config">[] = []
  const correlation = correlations[`${xColumn}_${yColumn}`] || correlations[`${yColumn}_${xColumn}`] || 0

  // Bar Chart Recommendations
  if (
    (xAnalysis.type === "categorical" && yAnalysis.type === "numerical") ||
    (xAnalysis.type === "numerical" && yAnalysis.type === "categorical")
  ) {
    const confidence = calculateBarChartConfidence(xAnalysis, yAnalysis)
    recommendations.push({
      type: "bar",
      title: `${yColumn} by ${xColumn}`,
      description: "Perfect for comparing values across categories",
      xColumn,
      yColumn,
      confidence,
      reasoning: [
        "Categorical vs numerical data is ideal for bar charts",
        "Easy to compare values across different categories",
        "Clear visual hierarchy and readability",
      ],
      pros: ["Clear comparisons", "Easy to read", "Good for presentations"],
      cons: ["Limited to categorical data", "Can be cluttered with many categories"],
      icon: "BarChart3",
      color: "#3b82f6",
      gradient: "bg-gradient-to-r from-blue-600 to-blue-700",
      suitability: confidence > 80 ? "excellent" : confidence > 65 ? "good" : "fair",
      dataInsights: generateDataInsights(xAnalysis, yAnalysis, "bar"),
    })
  }

  // Line Chart Recommendations
  if (
    xAnalysis.type === "temporal" ||
    yAnalysis.type === "temporal" ||
    (xAnalysis.type === "numerical" && yAnalysis.type === "numerical" && Math.abs(correlation) > 0.3)
  ) {
    const confidence = calculateLineChartConfidence(xAnalysis, yAnalysis, correlation)
    recommendations.push({
      type: "line",
      title: `${yColumn} Trend Over ${xColumn}`,
      description: "Ideal for showing trends and changes over time",
      xColumn,
      yColumn,
      confidence,
      reasoning: [
        "Time series data shows trends effectively",
        "Continuous data reveals patterns over time",
        "Good correlation suggests meaningful relationship",
      ],
      pros: ["Shows trends clearly", "Good for time series", "Reveals patterns"],
      cons: ["Can be noisy with too many data points", "Requires ordered data"],
      icon: "LineChart",
      color: "#10b981",
      gradient: "bg-gradient-to-r from-green-600 to-green-700",
      suitability: confidence > 80 ? "excellent" : confidence > 65 ? "good" : "fair",
      dataInsights: generateDataInsights(xAnalysis, yAnalysis, "line"),
    })
  }

  // Scatter Plot Recommendations
  if (xAnalysis.type === "numerical" && yAnalysis.type === "numerical") {
    const confidence = calculateScatterConfidence(xAnalysis, yAnalysis, correlation)
    recommendations.push({
      type: "scatter",
      title: `${yColumn} vs ${xColumn} Correlation`,
      description: "Perfect for exploring relationships between numerical variables",
      xColumn,
      yColumn,
      confidence,
      reasoning: [
        "Both variables are numerical",
        `${Math.abs(correlation) > 0.5 ? "Strong" : "Moderate"} correlation detected (${(correlation * 100).toFixed(0)}%)`,
        "Scatter plots reveal data distribution patterns",
      ],
      pros: ["Shows correlations", "Reveals outliers", "Good for analysis"],
      cons: ["Can be cluttered with large datasets", "Requires numerical data"],
      icon: "ScatterChart",
      color: "#f59e0b",
      gradient: "bg-gradient-to-r from-yellow-600 to-orange-600",
      suitability: confidence > 80 ? "excellent" : confidence > 65 ? "good" : "fair",
      dataInsights: generateDataInsights(xAnalysis, yAnalysis, "scatter"),
    })
  }

  // Pie Chart Recommendations
  if (xAnalysis.type === "categorical" && yAnalysis.type === "numerical" && xAnalysis.uniqueValues <= 10) {
    const confidence = calculatePieChartConfidence(xAnalysis, yAnalysis)
    recommendations.push({
      type: "pie",
      title: `${yColumn} Distribution by ${xColumn}`,
      description: "Great for showing proportions and parts of a whole",
      xColumn,
      yColumn,
      confidence,
      reasoning: [
        "Categorical data with limited categories",
        "Shows proportional relationships clearly",
        "Good for part-to-whole analysis",
      ],
      pros: ["Shows proportions clearly", "Visually appealing", "Easy to understand"],
      cons: ["Limited to few categories", "Hard to compare similar values"],
      icon: "PieChart",
      color: "#8b5cf6",
      gradient: "bg-gradient-to-r from-purple-600 to-purple-700",
      suitability: confidence > 80 ? "excellent" : confidence > 65 ? "good" : "fair",
      dataInsights: generateDataInsights(xAnalysis, yAnalysis, "pie"),
    })
  }

  // 3D Column Chart Recommendations
  if (xAnalysis.type === "categorical" && yAnalysis.type === "numerical" && xAnalysis.uniqueValues <= 20) {
    const confidence = calculate3DChartConfidence(xAnalysis, yAnalysis)
    recommendations.push({
      type: "3d-column",
      title: `3D ${yColumn} by ${xColumn}`,
      description: "Interactive 3D visualization for impressive presentations",
      xColumn,
      yColumn,
      confidence,
      reasoning: [
        "Categorical data suitable for 3D columns",
        "Interactive visualization adds engagement",
        "Good for presentations and demos",
      ],
      pros: ["Visually impressive", "Interactive", "Good for presentations"],
      cons: ["Can be harder to read exact values", "Requires 3D support"],
      icon: "Box",
      color: "#ef4444",
      gradient: "bg-gradient-to-r from-red-600 to-pink-600",
      suitability: confidence > 80 ? "excellent" : confidence > 65 ? "good" : "fair",
      dataInsights: generateDataInsights(xAnalysis, yAnalysis, "3d-column"),
    })
  }

  return recommendations
}

function calculateBarChartConfidence(xAnalysis: ColumnAnalysis, yAnalysis: ColumnAnalysis): number {
  let confidence = 70

  // Boost confidence for ideal categorical vs numerical
  if (
    (xAnalysis.type === "categorical" && yAnalysis.type === "numerical") ||
    (xAnalysis.type === "numerical" && yAnalysis.type === "categorical")
  ) {
    confidence += 20
  }

  // Adjust for number of categories
  const categoricalAnalysis = xAnalysis.type === "categorical" ? xAnalysis : yAnalysis
  if (categoricalAnalysis.uniqueValues <= 10) {
    confidence += 10
  } else if (categoricalAnalysis.uniqueValues > 20) {
    confidence -= 15
  }

  return Math.min(95, Math.max(40, confidence))
}

function calculateLineChartConfidence(
  xAnalysis: ColumnAnalysis,
  yAnalysis: ColumnAnalysis,
  correlation: number,
): number {
  let confidence = 60

  // Boost for temporal data
  if (xAnalysis.type === "temporal" || yAnalysis.type === "temporal") {
    confidence += 25
  }

  // Boost for strong correlation
  if (Math.abs(correlation) > 0.7) {
    confidence += 20
  } else if (Math.abs(correlation) > 0.4) {
    confidence += 10
  }

  // Boost for numerical data
  if (xAnalysis.type === "numerical" && yAnalysis.type === "numerical") {
    confidence += 10
  }

  return Math.min(95, Math.max(40, confidence))
}

function calculateScatterConfidence(xAnalysis: ColumnAnalysis, yAnalysis: ColumnAnalysis, correlation: number): number {
  let confidence = 75

  // Both numerical is ideal
  if (xAnalysis.type === "numerical" && yAnalysis.type === "numerical") {
    confidence += 15
  }

  // Strong correlation boosts confidence
  if (Math.abs(correlation) > 0.7) {
    confidence += 15
  } else if (Math.abs(correlation) > 0.4) {
    confidence += 10
  } else if (Math.abs(correlation) < 0.1) {
    confidence -= 20
  }

  return Math.min(95, Math.max(40, confidence))
}

function calculatePieChartConfidence(xAnalysis: ColumnAnalysis, yAnalysis: ColumnAnalysis): number {
  let confidence = 65

  // Ideal for categorical with few categories
  if (xAnalysis.type === "categorical" && xAnalysis.uniqueValues <= 6) {
    confidence += 20
  } else if (xAnalysis.uniqueValues <= 10) {
    confidence += 10
  } else {
    confidence -= 20
  }

  // Numerical Y is good
  if (yAnalysis.type === "numerical") {
    confidence += 10
  }

  return Math.min(95, Math.max(30, confidence))
}

function calculate3DChartConfidence(xAnalysis: ColumnAnalysis, yAnalysis: ColumnAnalysis): number {
  let confidence = 55

  // Good for categorical with moderate categories
  if (xAnalysis.type === "categorical" && xAnalysis.uniqueValues <= 15) {
    confidence += 15
  }

  // Numerical Y is good
  if (yAnalysis.type === "numerical") {
    confidence += 10
  }

  return Math.min(85, Math.max(35, confidence))
}

function generateDataInsights(xAnalysis: ColumnAnalysis, yAnalysis: ColumnAnalysis, chartType: string): string[] {
  const insights: string[] = []

  if (xAnalysis.type === "numerical" && xAnalysis.outliers > 0) {
    insights.push(`${xAnalysis.outliers} outliers detected in ${chartType === "scatter" ? "X-axis" : "data"}`)
  }

  if (yAnalysis.type === "numerical" && yAnalysis.outliers > 0) {
    insights.push(`${yAnalysis.outliers} outliers detected in ${chartType === "scatter" ? "Y-axis" : "values"}`)
  }

  if (xAnalysis.type === "categorical") {
    insights.push(`${xAnalysis.uniqueValues} categories in the data`)
  }

  if (yAnalysis.type === "numerical" && yAnalysis.distribution) {
    insights.push(`Data follows a ${yAnalysis.distribution} distribution`)
  }

  if (xAnalysis.nullCount > 0 || yAnalysis.nullCount > 0) {
    const totalNulls = xAnalysis.nullCount + yAnalysis.nullCount
    insights.push(`${totalNulls} missing values may affect visualization`)
  }

  return insights
}

function getColorsForChart(chartType: string): string[] {
  const colorSchemes = {
    bar: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
    line: ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"],
    pie: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"],
    scatter: ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"],
    "3d-column": ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
  }

  return colorSchemes[chartType as keyof typeof colorSchemes] || colorSchemes.bar
}
