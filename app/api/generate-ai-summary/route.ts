import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { data, analysisType, customPrompt } = await request.json()

    if (!data || !data.headers || !data.data) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    // Prepare data sample for analysis
    const dataSample = prepareDataSample(data)

    // Generate AI summary
    const summary = await generateAISummary(dataSample, analysisType, customPrompt)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("AI Summary generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate AI summary. Please check your OpenAI API key and try again." },
      { status: 500 },
    )
  }
}

function prepareDataSample(data: any) {
  const { headers, data: rows, fileName, totalRows } = data

  // Calculate basic statistics
  const statistics = calculateBasicStatistics(headers, rows)

  // Sample data for analysis (first 50 rows)
  const sampleRows = rows.slice(0, 50)

  return {
    fileName,
    totalRows,
    headers,
    sampleData: sampleRows,
    statistics,
    dataTypes: inferDataTypes(headers, rows),
  }
}

function calculateBasicStatistics(headers: string[], rows: any[][]) {
  const stats: any = {}

  headers.forEach((header, index) => {
    const columnData = rows.map((row) => row[index]).filter((val) => val !== null && val !== undefined && val !== "")
    const numericData = columnData.filter((val) => !isNaN(Number(val))).map((val) => Number(val))

    stats[header] = {
      totalValues: columnData.length,
      nullValues: rows.length - columnData.length,
      completeness: (columnData.length / rows.length) * 100,
      isNumeric: numericData.length > columnData.length * 0.7,
      uniqueValues: new Set(columnData).size,
      ...(numericData.length > 0 && {
        min: Math.min(...numericData),
        max: Math.max(...numericData),
        avg: numericData.reduce((sum, val) => sum + val, 0) / numericData.length,
        median: calculateMedian(numericData),
      }),
    }
  })

  return stats
}

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function inferDataTypes(headers: string[], rows: any[][]) {
  const types: any = {}

  headers.forEach((header, index) => {
    const columnData = rows.map((row) => row[index]).filter((val) => val !== null && val !== undefined && val !== "")
    const numericCount = columnData.filter((val) => !isNaN(Number(val))).length
    const dateCount = columnData.filter((val) => !isNaN(Date.parse(val))).length

    if (numericCount > columnData.length * 0.8) {
      types[header] = "numeric"
    } else if (dateCount > columnData.length * 0.8) {
      types[header] = "date"
    } else {
      types[header] = "text"
    }
  })

  return types
}

async function generateAISummary(dataSample: any, analysisType: string, customPrompt?: string) {
  const systemPrompt = getSystemPrompt(analysisType)
  const userPrompt = generateUserPrompt(dataSample, customPrompt)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error("No response from OpenAI")
    }

    // Parse the AI response and structure it
    const structuredSummary = parseAIResponse(aiResponse, dataSample)

    return {
      id: generateId(),
      ...structuredSummary,
      statistics: {
        totalDataPoints: dataSample.totalRows,
        completenessScore: calculateOverallCompleteness(dataSample.statistics),
        qualityScore: calculateQualityScore(dataSample.statistics),
        diversityScore: calculateDiversityScore(dataSample.statistics),
      },
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("OpenAI API error:", error)
    throw new Error("Failed to generate AI summary")
  }
}

function getSystemPrompt(analysisType: string): string {
  const basePrompt = `You are an expert data analyst with deep knowledge in statistics, business intelligence, and data science. Your task is to analyze Excel/CSV data and provide comprehensive insights.

Please structure your response as a JSON object with the following format:
{
  "overview": "A comprehensive overview of the dataset (2-3 sentences)",
  "keyInsights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "trends": [
    {
      "title": "Trend Title",
      "description": "Detailed description",
      "type": "positive|negative|neutral",
      "confidence": 85
    }
  ],
  "anomalies": [
    {
      "title": "Anomaly Title",
      "description": "Description of the anomaly",
      "severity": "low|medium|high",
      "location": "Column/Row reference"
    }
  ],
  "suggestions": [
    {
      "title": "Suggestion Title",
      "description": "Actionable recommendation",
      "priority": "low|medium|high",
      "category": "data_quality|analysis|business"
    }
  ]
}`

  const typeSpecificPrompts = {
    comprehensive:
      "Focus on providing a balanced analysis covering all aspects of the data including trends, patterns, quality issues, and business insights.",
    trends: "Focus primarily on identifying and analyzing trends, patterns, and temporal changes in the data.",
    anomalies:
      "Focus on detecting outliers, inconsistencies, and unusual patterns that might indicate data quality issues or interesting phenomena.",
    business:
      "Focus on business intelligence insights, KPIs, performance metrics, and actionable business recommendations.",
  }

  return basePrompt + "\n\n" + typeSpecificPrompts[analysisType as keyof typeof typeSpecificPrompts]
}

function generateUserPrompt(dataSample: any, customPrompt?: string): string {
  let prompt = `Please analyze the following dataset:

**Dataset Information:**
- File: ${dataSample.fileName}
- Total Rows: ${dataSample.totalRows}
- Columns: ${dataSample.headers.join(", ")}

**Column Statistics:**
${Object.entries(dataSample.statistics)
  .map(
    ([col, stats]: [string, any]) =>
      `- ${col}: ${stats.totalValues} values, ${stats.completeness.toFixed(1)}% complete, ${stats.uniqueValues} unique values${stats.isNumeric ? `, numeric (${stats.min}-${stats.max}, avg: ${stats.avg?.toFixed(2)})` : ", text"}`,
  )
  .join("\n")}

**Data Types:**
${Object.entries(dataSample.dataTypes)
  .map(([col, type]) => `- ${col}: ${type}`)
  .join("\n")}

**Sample Data (first 10 rows):**
${dataSample.headers.join(" | ")}
${dataSample.sampleData
  .slice(0, 10)
  .map((row: any[]) => row.join(" | "))
  .join("\n")}`

  if (customPrompt) {
    prompt += `\n\n**Additional Analysis Requirements:**
${customPrompt}`
  }

  prompt += `\n\nPlease provide your analysis in the specified JSON format.`

  return prompt
}

function parseAIResponse(aiResponse: string, dataSample: any) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    }
  } catch (error) {
    console.error("Failed to parse AI response as JSON:", error)
  }

  // Fallback: create structured response from text
  return createFallbackStructure(aiResponse, dataSample)
}

function createFallbackStructure(aiResponse: string, dataSample: any) {
  return {
    overview: aiResponse.substring(0, 300) + "...",
    keyInsights: [
      "Data contains " + dataSample.totalRows + " rows across " + dataSample.headers.length + " columns",
      "Overall data completeness varies across columns",
      "Multiple data types detected including numeric and text fields",
      "Further analysis recommended for detailed insights",
      "Consider data cleaning for optimal analysis results",
    ],
    trends: [
      {
        title: "Data Distribution Pattern",
        description: "The dataset shows varied distribution patterns across different columns",
        type: "neutral" as const,
        confidence: 70,
      },
    ],
    anomalies: [
      {
        title: "Missing Data Points",
        description: "Some columns contain missing or null values that may affect analysis",
        severity: "medium" as const,
        location: "Multiple columns",
      },
    ],
    suggestions: [
      {
        title: "Data Quality Assessment",
        description: "Perform comprehensive data quality checks before analysis",
        priority: "high" as const,
        category: "data_quality",
      },
      {
        title: "Statistical Analysis",
        description: "Consider running statistical tests on numeric columns",
        priority: "medium" as const,
        category: "analysis",
      },
    ],
  }
}

function calculateOverallCompleteness(statistics: any): number {
  const completenessValues = Object.values(statistics).map((stat: any) => stat.completeness)
  return Math.round(completenessValues.reduce((sum: number, val: number) => sum + val, 0) / completenessValues.length)
}

function calculateQualityScore(statistics: any): number {
  // Simple quality score based on completeness and uniqueness
  let score = 0
  const columns = Object.values(statistics)

  columns.forEach((stat: any) => {
    score += stat.completeness * 0.6 // Completeness weight
    score += Math.min((stat.uniqueValues / stat.totalValues) * 100, 100) * 0.4 // Uniqueness weight
  })

  return Math.round(score / columns.length)
}

function calculateDiversityScore(statistics: any): number {
  // Diversity based on unique values ratio
  const diversityScores = Object.values(statistics).map((stat: any) =>
    Math.min((stat.uniqueValues / stat.totalValues) * 100, 100),
  )
  return Math.round(diversityScores.reduce((sum: number, val: number) => sum + val, 0) / diversityScores.length)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
