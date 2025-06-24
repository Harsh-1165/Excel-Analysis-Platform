import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get current date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get system statistics
    const [
      totalUsers,
      activeUsers,
      totalUploads,
      totalCharts,
      totalAISummaries,
      uploadsToday,
      uploadsThisWeek,
      uploadsThisMonth,
      storageStats,
    ] = await Promise.all([
      // Total users
      db
        .collection("users")
        .countDocuments(),

      // Active users
      db
        .collection("users")
        .countDocuments({ isActive: true }),

      // Total uploads
      db
        .collection("uploads")
        .countDocuments(),

      // Total charts
      db
        .collection("charts")
        .countDocuments(),

      // Total AI summaries
      db
        .collection("ai_summaries")
        .countDocuments(),

      // Uploads today
      db
        .collection("uploads")
        .countDocuments({
          uploadDate: { $gte: today },
        }),

      // Uploads this week
      db
        .collection("uploads")
        .countDocuments({
          uploadDate: { $gte: thisWeek },
        }),

      // Uploads this month
      db
        .collection("uploads")
        .countDocuments({
          uploadDate: { $gte: thisMonth },
        }),

      // Storage and data point statistics
      db
        .collection("uploads")
        .aggregate([
          {
            $group: {
              _id: null,
              totalStorageUsed: { $sum: "$fileSize" },
              totalDataPoints: { $sum: "$totalRows" },
            },
          },
        ])
        .toArray(),
    ])

    const storageData = storageStats[0] || { totalStorageUsed: 0, totalDataPoints: 0 }

    // If no data exists, return sample statistics
    if (totalUsers === 0) {
      return NextResponse.json({
        totalUsers: 4,
        activeUsers: 3,
        totalUploads: 6,
        totalCharts: 14,
        totalAISummaries: 7,
        totalDataPoints: 93070,
        totalStorageUsed: 23068672, // ~22MB
        uploadsToday: 1,
        uploadsThisWeek: 3,
        uploadsThisMonth: 6,
      })
    }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalUploads,
      totalCharts,
      totalAISummaries,
      totalDataPoints: storageData.totalDataPoints,
      totalStorageUsed: storageData.totalStorageUsed,
      uploadsToday,
      uploadsThisWeek,
      uploadsThisMonth,
    })
  } catch (error) {
    console.error("Failed to fetch system stats:", error)
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 })
  }
}
