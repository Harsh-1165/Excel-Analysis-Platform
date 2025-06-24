import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    const recommendation = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("chart_recommendations").insertOne(recommendation)

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...recommendation,
    })
  } catch (error) {
    console.error("Failed to save chart recommendation:", error)
    return NextResponse.json({ error: "Failed to save recommendation" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get("fileName")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    const { db } = await connectToDatabase()

    const filter = fileName ? { "dataSource.fileName": fileName } : {}

    const recommendations = await db
      .collection("chart_recommendations")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("chart_recommendations").countDocuments(filter)

    return NextResponse.json({
      recommendations: recommendations.map((rec) => ({
        ...rec,
        id: rec._id.toString(),
      })),
      total,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    console.error("Failed to fetch chart recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Recommendation ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("chart_recommendations").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete chart recommendation:", error)
    return NextResponse.json({ error: "Failed to delete recommendation" }, { status: 500 })
  }
}
