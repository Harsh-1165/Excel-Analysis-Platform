import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get activity data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const activityData = await db
      .collection("uploads")
      .aggregate([
        {
          $match: {
            uploadDate: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$uploadDate",
              },
            },
            uploads: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "charts",
            let: { date: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$createdAt",
                        },
                      },
                      "$$date",
                    ],
                  },
                },
              },
            ],
            as: "chartsData",
          },
        },
        {
          $lookup: {
            from: "ai_summaries",
            let: { date: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$createdAt",
                        },
                      },
                      "$$date",
                    ],
                  },
                },
              },
            ],
            as: "aiSummariesData",
          },
        },
        {
          $addFields: {
            charts: { $size: "$chartsData" },
            aiSummaries: { $size: "$aiSummariesData" },
            activeUsers: { $multiply: ["$uploads", 0.7] }, // Estimate active users
          },
        },
        {
          $project: {
            date: "$_id",
            uploads: 1,
            charts: 1,
            aiSummaries: 1,
            activeUsers: { $round: "$activeUsers" },
            _id: 0,
          },
        },
        {
          $sort: { date: 1 },
        },
      ])
      .toArray()

    // If no activity data exists, generate sample data
    if (activityData.length === 0) {
      const sampleData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateString = date.toISOString().split("T")[0]

        // Generate realistic sample data with some variation
        const uploads = Math.floor(Math.random() * 8) + 1 // 1-8 uploads per day
        const charts = Math.floor(uploads * (Math.random() * 2 + 1)) // 1-3 charts per upload
        const aiSummaries = Math.floor(uploads * (Math.random() * 0.8 + 0.2)) // 0.2-1 AI summary per upload
        const activeUsers = Math.floor(uploads * (Math.random() * 0.5 + 0.5)) // 0.5-1 active user per upload

        sampleData.push({
          date: dateString,
          uploads,
          charts,
          aiSummaries,
          activeUsers,
        })
      }

      return NextResponse.json(sampleData)
    }

    // Fill in missing dates with zero values
    const filledData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split("T")[0]

      const existingData = activityData.find((item) => item.date === dateString)
      if (existingData) {
        filledData.push(existingData)
      } else {
        filledData.push({
          date: dateString,
          uploads: 0,
          charts: 0,
          aiSummaries: 0,
          activeUsers: 0,
        })
      }
    }

    return NextResponse.json(filledData)
  } catch (error) {
    console.error("Failed to fetch activity data:", error)
    return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 })
  }
}
