import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Get usage statistics
    const [apiUsage, webhookStats] = await Promise.all([
      // API usage stats
      db
        .collection("api_usage")
        .aggregate([
          {
            $group: {
              _id: null,
              totalRequests: { $sum: "$requestCount" },
              successfulRequests: { $sum: "$successCount" },
              failedRequests: { $sum: "$errorCount" },
              averageResponseTime: { $avg: "$responseTime" },
            },
          },
        ])
        .toArray(),

      // Webhook stats
      db
        .collection("webhooks")
        .aggregate([
          {
            $group: {
              _id: null,
              totalWebhooks: { $sum: 1 },
              activeWebhooks: {
                $sum: { $cond: ["$isActive", 1, 0] },
              },
              totalSuccesses: { $sum: "$successCount" },
              totalFailures: { $sum: "$failureCount" },
            },
          },
        ])
        .toArray(),
    ])

    // If no usage data exists, return sample data
    if (apiUsage.length === 0) {
      const sampleStats = {
        totalRequests: 15847,
        successfulRequests: 15234,
        failedRequests: 613,
        averageResponseTime: 245,
        topEndpoints: [
          { endpoint: "/api/v1/upload", count: 5234 },
          { endpoint: "/api/v1/charts", count: 3456 },
          { endpoint: "/api/v1/summaries", count: 2789 },
          { endpoint: "/api/v1/data", count: 2145 },
          { endpoint: "/api/v1/analysis", count: 1823 },
        ],
        dailyUsage: generateDailyUsage(),
      }

      return NextResponse.json(sampleStats)
    }

    const stats = apiUsage[0]
    const webhookData = webhookStats[0] || {}

    // Get top endpoints
    const topEndpoints = await db
      .collection("api_usage")
      .aggregate([
        {
          $group: {
            _id: "$endpoint",
            count: { $sum: "$requestCount" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $project: {
            endpoint: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    // Get daily usage for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const dailyUsage = await db
      .collection("api_usage")
      .aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            requests: { $sum: "$requestCount" },
          },
        },
        {
          $project: {
            date: "$_id",
            requests: 1,
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ])
      .toArray()

    return NextResponse.json({
      ...stats,
      topEndpoints: topEndpoints.length > 0 ? topEndpoints : generateSampleEndpoints(),
      dailyUsage: dailyUsage.length > 0 ? dailyUsage : generateDailyUsage(),
      webhookStats: webhookData,
    })
  } catch (error) {
    console.error("Failed to fetch usage stats:", error)
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}

function generateSampleEndpoints() {
  return [
    { endpoint: "/api/v1/upload", count: 5234 },
    { endpoint: "/api/v1/charts", count: 3456 },
    { endpoint: "/api/v1/summaries", count: 2789 },
    { endpoint: "/api/v1/data", count: 2145 },
    { endpoint: "/api/v1/analysis", count: 1823 },
  ]
}

function generateDailyUsage() {
  const usage = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split("T")[0]
    const requests = Math.floor(Math.random() * 500) + 100 // 100-600 requests per day
    usage.push({ date: dateString, requests })
  }
  return usage
}
