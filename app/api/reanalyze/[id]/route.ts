import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    const upload = await db.collection("uploads").findOne({ _id: new ObjectId(id) })

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Update last accessed time
    await db.collection("uploads").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastAccessed: new Date(),
        },
      },
    )

    // Return the upload data in the format expected by the frontend
    return NextResponse.json({
      headers: upload.headers,
      data: upload.data,
      fileName: upload.fileName,
      sheetName: upload.sheetName,
      totalRows: upload.totalRows,
      uploadId: upload._id.toString(),
    })
  } catch (error) {
    console.error("Failed to reanalyze upload:", error)
    return NextResponse.json({ error: "Failed to reanalyze upload" }, { status: 500 })
  }
}
