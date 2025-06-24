import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { expression, headers, data } = await request.json()

    if (!expression || !headers || !data) {
      return NextResponse.json({ error: "Expression, headers, and data are required" }, { status: 400 })
    }

    // Validate formula first
    const validation = validateFormulaExpression(expression, headers)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Evaluate formula for all rows
    const results = evaluateFormulaExpression(expression, headers, data)
    const validResults = results.filter((r) => r.error === null).length

    return NextResponse.json({
      result: results,
      totalRows: data.length,
      validResults,
      expression: expression,
    })
  } catch (error) {
    console.error("Formula evaluation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Evaluation failed",
      },
      { status: 500 },
    )
  }
}

function validateFormulaExpression(expression: string, headers: string[]) {
  const cleanExpression = expression.startsWith("=") ? expression.slice(1) : expression

  // Check for column references
  const columnReferences = cleanExpression.match(/\[([^\]]+)\]/g) || []
  const invalidColumns = []

  for (const ref of columnReferences) {
    const columnName = ref.slice(1, -1)
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

  // Security validation
  const forbiddenPatterns = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /=\s*>/,
    /import\s+/i,
    /require\s*\(/i,
    /process\./i,
    /global\./i,
    /window\./i,
  ]

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
      const result = evaluateFormulaForRow(cleanExpression, headers, data[rowIndex], data)
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

function evaluateFormulaForRow(expression: string, headers: string[], rowData: any[], allData: any[][]) {
  let processedExpression = expression

  // Replace column references with actual values
  const columnReferences = expression.match(/\[([^\]]+)\]/g) || []
  for (const ref of columnReferences) {
    const columnName = ref.slice(1, -1)
    const columnIndex = headers.indexOf(columnName)
    if (columnIndex !== -1) {
      const value = rowData[columnIndex]
      // Handle different data types
      if (value === null || value === undefined || value === "") {
        processedExpression = processedExpression.replace(ref, "0")
      } else if (isNaN(Number(value))) {
        // String value - wrap in quotes
        processedExpression = processedExpression.replace(ref, `"${String(value).replace(/"/g, '\\"')}"`)
      } else {
        // Numeric value
        processedExpression = processedExpression.replace(ref, Number(value).toString())
      }
    }
  }

  // Handle built-in functions that operate on entire columns
  processedExpression = processBuiltInFunctions(processedExpression, headers, allData)

  // Handle conditional functions
  processedExpression = processConditionalFunctions(processedExpression)

  // Handle string functions
  processedExpression = processStringFunctions(processedExpression)

  // Safe evaluation
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
      
      // String functions
      const concat = (...args) => args.join('');
      const upper = (str) => String(str).toUpperCase();
      const lower = (str) => String(str).toLowerCase();
      const len = (str) => String(str).length;
      
      return ${processedExpression};
    `,
    )

    return func(Math)
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function processBuiltInFunctions(expression: string, headers: string[], data: any[][]) {
  // Handle aggregate functions: SUM, AVG, MIN, MAX, COUNT
  const functionPattern = /(SUM|AVG|MIN|MAX|COUNT)$$\[([^\]]+)\]$$/g

  return expression.replace(functionPattern, (match, funcName, columnName) => {
    const columnIndex = headers.indexOf(columnName)
    if (columnIndex === -1) return "0"

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
        return "0"
    }
  })
}

function processConditionalFunctions(expression: string) {
  // Handle IF function: IF(condition, true_value, false_value)
  const ifPattern = /IF\s*$$\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*$$/g

  return expression.replace(ifPattern, (match, condition, trueValue, falseValue) => {
    return `(${condition} ? ${trueValue} : ${falseValue})`
  })
}

function processStringFunctions(expression: string) {
  // Handle CONCAT function
  const concatPattern = /CONCAT\s*$$\s*([^)]+)\s*$$/g
  expression = expression.replace(concatPattern, (match, args) => {
    return `concat(${args})`
  })

  // Handle UPPER function
  const upperPattern = /UPPER\s*$$\s*([^)]+)\s*$$/g
  expression = expression.replace(upperPattern, (match, arg) => {
    return `upper(${arg})`
  })

  // Handle LOWER function
  const lowerPattern = /LOWER\s*$$\s*([^)]+)\s*$$/g
  expression = expression.replace(lowerPattern, (match, arg) => {
    return `lower(${arg})`
  })

  // Handle LEN function
  const lenPattern = /LEN\s*$$\s*([^)]+)\s*$$/g
  expression = expression.replace(lenPattern, (match, arg) => {
    return `len(${arg})`
  })

  return expression
}
