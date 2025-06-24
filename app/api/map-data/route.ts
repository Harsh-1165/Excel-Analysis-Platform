import { type NextRequest, NextResponse } from "next/server"

interface MapDataRequest {
  headers: string[]
  data: any[][]
  xColumn: string
  yColumn: string
}

interface Statistics {
  min: number
  max: number
  avg: number
  type: "numeric" | "text" | "mixed"
}

export async function POST(request: NextRequest) {
  try {
    const body: MapDataRequest = await request.json()
    const { headers, data, xColumn, yColumn } = body

    if (!headers || !data || !xColumn || !yColumn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (xColumn === yColumn) {
      return NextResponse.json({ error: "X and Y columns must be different" }, { status: 400 })
    }

    // Find column indices
    const xIndex = headers.indexOf(xColumn)
    const yIndex = headers.indexOf(yColumn)

    if (xIndex === -1 || yIndex === -1) {
      return NextResponse.json({ error: "Selected columns not found in data" }, { status: 400 })
    }

    // Extract and map data
    const mappedData = data.map((row, index) => ({
      x: row[xIndex],
      y: row[yIndex],
      originalIndex: index,
    }))

    // Filter out null/undefined values for statistics
    const validData = mappedData.filter(
      (item) =>
        item.x !== null &&
        item.x !== undefined &&
        item.x !== "" &&
        item.y !== null &&
        item.y !== undefined &&
        item.y !== "",
    )

    // Calculate statistics for X column
    const xValues = validData.map((item) => item.x)
    const xStats = calculateColumnStats(xValues)

    // Calculate statistics for Y column
    const yValues = validData.map((item) => item.y)
    const yStats = calculateColumnStats(yValues)

    // Calculate correlation if both columns are numeric
    let correlation: number | null = null
    if (xStats.type === "numeric" && yStats.type === "numeric") {
      correlation = calculateCorrelation(
        xValues.map((v) => Number(v)),
        yValues.map((v) => Number(v)),
      )
    }

    const response = {
      xColumn,
      yColumn,
      mappedData,
      statistics: {
        xStats,
        yStats,
        correlation,
        validPairs: validData.length,
        totalPairs: mappedData.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Data mapping error:", error)
    return NextResponse.json({ error: "Internal server error during data mapping" }, { status: 500 })
  }
}

function calculateColumnStats(values: any[]): Statistics {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, type: "text" }
  }

  // Check if values are numeric
  const numericValues = values.filter((v) => !isNaN(Number(v)) && v !== "").map((v) => Number(v))
  const numericRatio = numericValues.length / values.length

  if (numericRatio > 0.8) {
    // Mostly numeric
    const min = Math.min(...numericValues)
    const max = Math.max(...numericValues)
    const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length

    return {
      min: isFinite(min) ? min : 0,
      max: isFinite(max) ? max : 0,
      avg: isFinite(avg) ? avg : 0,
      type: "numeric",
    }
  } else if (numericRatio > 0.3) {
    // Mixed data
    return { min: 0, max: 0, avg: 0, type: "mixed" }
  } else {
    // Mostly text
    return { min: 0, max: 0, avg: 0, type: "text" }
  }
}

function calculateCorrelation(xValues: number[], yValues: number[]): number {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return 0
  }

  const n = xValues.length
  const sumX = xValues.reduce((sum, val) => sum + val, 0)
  const sumY = yValues.reduce((sum, val) => sum + val, 0)
  const sumXY = xValues.reduce((sum, val, i) => sum + val * yValues[i], 0)
  const sumXX = xValues.reduce((sum, val) => sum + val * val, 0)
  const sumYY = yValues.reduce((sum, val) => sum + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  if (denominator === 0) return 0

  const correlation = numerator / denominator
  return isFinite(correlation) ? correlation : 0
}
