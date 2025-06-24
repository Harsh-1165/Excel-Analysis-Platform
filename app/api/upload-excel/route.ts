import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const allowedExtensions = [".xls", ".xlsx"]

    const hasValidType = allowedTypes.includes(file.type)
    const hasValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidType && !hasValidExtension) {
      return NextResponse.json({ error: "Invalid file type. Please upload .xls or .xlsx files only." }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: "buffer" })

      // Get first sheet name
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        return NextResponse.json({ error: "No sheets found in the Excel file" }, { status: 400 })
      }

      // Get worksheet
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as any[][]

      if (jsonData.length === 0) {
        return NextResponse.json({ error: "The Excel file appears to be empty" }, { status: 400 })
      }

      // Extract headers (first row)
      const headers = jsonData[0]?.map((header, index) => header?.toString().trim() || `Column ${index + 1}`) || []

      // Extract data rows (excluding header)
      const dataRows = jsonData
        .slice(1)
        .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))

      // Ensure all rows have the same number of columns as headers
      const normalizedData = dataRows.map((row) => {
        const normalizedRow = new Array(headers.length).fill("")
        for (let i = 0; i < headers.length; i++) {
          normalizedRow[i] = row[i] !== null && row[i] !== undefined ? row[i] : ""
        }
        return normalizedRow
      })

      const processingTime = Date.now() - startTime

      // Save to database
      const { db } = await connectToDatabase()
      const uploadRecord = {
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        uploadDate: new Date(),
        totalRows: normalizedData.length,
        totalColumns: headers.length,
        sheetName,
        headers,
        data: normalizedData,
        status: "completed",
        chartsGenerated: [],
        aiSummariesGenerated: [],
        lastAccessed: new Date(),
        processingTime,
      }

      const result = await db.collection("uploads").insertOne(uploadRecord)

      const response = {
        uploadId: result.insertedId.toString(),
        fileName: file.name,
        sheetName,
        headers,
        data: normalizedData,
        totalRows: normalizedData.length,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      }

      return NextResponse.json(response)
    } catch (parseError) {
      console.error("Excel parsing error:", parseError)
      return NextResponse.json(
        { error: "Failed to parse Excel file. Please ensure the file is not corrupted." },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error during file upload" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
