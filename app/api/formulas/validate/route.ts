import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { expression, headers, sampleData } = await request.json()

    if (!expression || !headers) {
      return NextResponse.json({ error: "Expression and headers are required" }, { status: 400 })
    }

    // Basic validation
    const validation = validateFormulaExpression(expression, headers)

    if (!validation.isValid) {
      return NextResponse.json(validation)
    }

    // Test with sample data
    try {
      const testResult = evaluateFormulaExpression(expression, headers, sampleData.slice(0, 3))
      return NextResponse.json({
        isValid: true,
        message: "Formula is valid",
        sampleResults: testResult.slice(0, 3),
      })
    } catch (error) {
      return NextResponse.json({
        isValid: false,
        error: `Formula evaluation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  } catch (error) {
    console.error("Formula validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}

function validateFormulaExpression(expression: string, headers: string[]) {
  // Remove leading = if present
  const cleanExpression = expression.startsWith("=") ? expression.slice(1) : expression

  // Check for column references
  const columnReferences = cleanExpression.match(/\[([^\]]+)\]/g) || []
  const invalidColumns = []

  for (const ref of columnReferences) {
    const columnName = ref.slice(1, -1) // Remove brackets
    if (!headers.includes(columnName)) {
      invalidColumns.push(columnName)
    }
  }

  if (invalidColumns.length > 0) {
    return {
      isValid: false,
      error: `Invalid column references: ${invalidColumns.join(", ")}`,
    }
  }

  // Basic syntax validation
  const forbiddenPatterns = [/eval\s*\(/i, /function\s*\(/i, /=\s*>/, /import\s+/i, /require\s*\(/i]

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(cleanExpression)) {
      return {
        isValid: false,
        error: "Formula contains forbidden syntax",
      }
    }
  }

  return { isValid: true }
}

function evaluateFormulaExpression(expression: string, headers: string[], data: any[][]) {
  const cleanExpression = expression.startsWith("=") ? expression.slice(1) : expression
  const results = []

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    try {
      const result = evaluateFormulaForRow(cleanExpression, headers, data[rowIndex])
      results.push({ value: result, error: null })
    } catch (error) {
      results.push({
        value: null,
        error: error instanceof Error ? error.message : "Evaluation error",
      })
    }
  }

  return results
}

function evaluateFormulaForRow(expression: string, headers: string[], rowData: any[]) {
  let processedExpression = expression

  // Replace column references with actual values
  const columnReferences = expression.match(/\[([^\]]+)\]/g) || []
  for (const ref of columnReferences) {
    const columnName = ref.slice(1, -1)
    const columnIndex = headers.indexOf(columnName)
    if (columnIndex !== -1) {
      const value = rowData[columnIndex]
      const numericValue = isNaN(Number(value)) ? `"${value}"` : Number(value)
      processedExpression = processedExpression.replace(ref, numericValue.toString())
    }
  }

  // Handle built-in functions
  processedExpression = processBuiltInFunctions(processedExpression, headers, [rowData])

  // Safe evaluation using Function constructor with restricted scope
  try {
    const func = new Function(
      "Math",
      `
      "use strict";
      const abs = Math.abs;
      const sqrt = Math.sqrt;
      const pow = Math.pow;
      const round = Math.round;
      const floor = Math.floor;
      const ceil = Math.ceil;
      const min = Math.min;
      const max = Math.max;
      
      return ${processedExpression};
    `,
    )

    return func(Math)
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function processBuiltInFunctions(expression: string, headers: string[], data: any[][]) {
  // Handle SUM, AVG, MIN, MAX, COUNT functions
  const functionPattern = /(SUM|AVG|MIN|MAX|COUNT)$$\[([^\]]+)\]$$/g

  return expression.replace(functionPattern, (match, funcName, columnName) => {
    const columnIndex = headers.indexOf(columnName)
    if (columnIndex === -1) return match

    const columnValues = data
      .map((row) => row[columnIndex])
      .filter((val) => val !== null && val !== undefined && val !== "" && !isNaN(Number(val)))
      .map((val) => Number(val))

    switch (funcName) {
      case "SUM":
        return columnValues.reduce((sum, val) => sum + val, 0).toString()
      case "AVG":
        return columnValues.length > 0
          ? (columnValues.reduce((sum, val) => sum + val, 0) / columnValues.length).toString()
          : "0"
      case "MIN":
        return columnValues.length > 0 ? Math.min(...columnValues).toString() : "0"
      case "MAX":
        return columnValues.length > 0 ? Math.max(...columnValues).toString() : "0"
      case "COUNT":
        return columnValues.length.toString()
      default:
        return match
    }
  })
}
