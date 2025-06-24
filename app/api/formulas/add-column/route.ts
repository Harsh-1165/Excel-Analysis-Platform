import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { columnName, expression, result, headers, data } = await request.json()

    if (!columnName || !expression || !result || !headers || !data) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if column name already exists
    if (headers.includes(columnName)) {
      return NextResponse.json({ error: "Column name already exists" }, { status: 400 })
    }

    // Create new headers array with the calculated column
    const newHeaders = [...headers, columnName]

    // Create new data array with calculated values
    const newData = data.map((row: any[], index: number) => {
      const calculatedValue = result[index]?.value ?? null
      return [...row, calculatedValue]
    })

    // Save to database (optional - for persistence)
    try {
      const { db } = await connectToDatabase()
      await db.collection("calculated_columns").insertOne({
        columnName,
        expression,
        originalHeaders: headers,
        createdAt: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error("Failed to save calculated column to database:", dbError)
      // Continue without saving to DB
    }

    return NextResponse.json({
      headers: newHeaders,
      data: newData,
      fileName: `Modified Dataset`,
      sheetName: "Sheet1",
      totalRows: newData.length,
      addedColumn: {
        name: columnName,
        expression,
        position: newHeaders.length - 1,
      },
    })
  } catch (error) {
    console.error("Failed to add calculated column:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add calculated column",
      },
      { status: 500 },
    )
  }
}
