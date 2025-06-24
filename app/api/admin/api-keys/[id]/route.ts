import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()

    const result = await db.collection("api_keys").deleteOne({
      _id: new ObjectId(params.id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete API key:", error)
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("api_keys").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update API key:", error)
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 })
  }
}
