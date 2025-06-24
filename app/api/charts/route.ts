import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const charts = await db.collection("charts").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(
      charts.map((chart) => ({
        ...chart,
        id: chart._id.toString(),
        _id: undefined,
      })),
    )
  } catch (error) {
    console.error("Failed to fetch charts:", error)
    return NextResponse.json({ error: "Failed to fetch charts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    const chartData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("charts").insertOne(chartData)

    // Update the upload record to include this chart
    if (body.dataSource?.fileName) {
      await db.collection("uploads").updateOne(
        { fileName: body.dataSource.fileName },
        {
          $push: {
            chartsGenerated: {
              id: result.insertedId.toString(),
              name: body.name,
              type: body.type,
              createdAt: new Date(),
            },
          },
        },
      )
    }

    return NextResponse.json({
      ...chartData,
      id: result.insertedId.toString(),
      _id: undefined,
    })
  } catch (error) {
    console.error("Failed to save chart:", error)
    return NextResponse.json({ error: "Failed to save chart" }, { status: 500 })
  }
}
