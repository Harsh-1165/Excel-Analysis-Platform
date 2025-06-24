import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { token } = params

    // Find shareable link
    const shareableLink = await db.collection("shareable_links").findOne({
      token,
      isActive: true,
    })

    if (!shareableLink) {
      return NextResponse.json({ error: "Invalid or inactive link" }, { status: 404 })
    }

    // Check if link is expired
    if (shareableLink.expiresAt && new Date() > new Date(shareableLink.expiresAt)) {
      return NextResponse.json({ error: "Link has expired" }, { status: 410 })
    }

    // Get upload data
    const upload = await db.collection("uploads").findOne({
      _id: shareableLink.uploadId,
    })

    if (!upload) {
      return NextResponse.json({ error: "Associated file not found" }, { status: 404 })
    }

    // Update access count and last accessed
    await db.collection("shareable_links").updateOne(
      { _id: shareableLink._id },
      {
        $inc: { accessCount: 1 },
        $set: { lastAccessed: new Date() },
      },
    )

    return NextResponse.json({
      link: {
        role: shareableLink.role,
        expiresAt: shareableLink.expiresAt,
        accessCount: shareableLink.accessCount + 1,
      },
      upload: {
        id: upload._id.toString(),
        fileName: upload.fileName,
        originalName: upload.originalName,
        headers: upload.headers,
        data: upload.data,
        totalRows: upload.totalRows,
        totalColumns: upload.totalColumns,
        sheetName: upload.sheetName,
        uploadDate: upload.uploadDate,
      },
    })
  } catch (error) {
    console.error("Failed to access shared link:", error)
    return NextResponse.json({ error: "Failed to access shared link" }, { status: 500 })
  }
}
