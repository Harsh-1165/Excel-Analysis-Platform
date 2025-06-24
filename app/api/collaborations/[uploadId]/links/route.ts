import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId } = params

    if (!ObjectId.isValid(uploadId)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    const links = await db
      .collection("shareable_links")
      .find({ uploadId: new ObjectId(uploadId) })
      .sort({ createdAt: -1 })
      .toArray()

    const shareableLinks = links.map((link) => ({
      id: link._id.toString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${link.token}`,
      role: link.role,
      expiresAt: link.expiresAt,
      isActive: link.isActive,
      accessCount: link.accessCount || 0,
      createdAt: link.createdAt,
      lastAccessed: link.lastAccessed,
    }))

    return NextResponse.json(shareableLinks)
  } catch (error) {
    console.error("Failed to fetch shareable links:", error)
    return NextResponse.json({ error: "Failed to fetch shareable links" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { uploadId } = params
    const { role, expiresAt } = await request.json()

    if (!ObjectId.isValid(uploadId)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 })
    }

    if (!["viewer", "editor"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get upload info
    const upload = await db.collection("uploads").findOne({ _id: new ObjectId(uploadId) })
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Create shareable link
    const token = nanoid(32)
    const shareableLink = {
      uploadId: new ObjectId(uploadId),
      token,
      role,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      accessCount: 0,
      createdAt: new Date(),
      createdBy: "current-user@example.com", // TODO: Get from session
      fileName: upload.fileName,
    }

    const result = await db.collection("shareable_links").insertOne(shareableLink)

    return NextResponse.json({
      success: true,
      linkId: result.insertedId.toString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`,
    })
  } catch (error) {
    console.error("Failed to create shareable link:", error)
    return NextResponse.json({ error: "Failed to create shareable link" }, { status: 500 })
  }
}
