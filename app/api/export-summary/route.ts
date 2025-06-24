import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import puppeteer from "puppeteer"

export async function POST(request: NextRequest) {
  try {
    const { summary, dataSource } = await request.json()

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1200, height: 1600 })

      const htmlContent = generateSummaryHTML(summary, dataSource)
      await page.setContent(htmlContent)

      await page.waitForTimeout(2000)

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      })

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              format: "pdf",
              public_id: `ai-summaries/${summary.id}_${Date.now()}`,
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
          .end(pdf)
      })

      return NextResponse.json({ url: (uploadResult as any).secure_url })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error("Export summary error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function generateSummaryHTML(summary: any, dataSource: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>AI Data Analysis Summary</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #f8f9fa;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
            }
            .stat-label {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
            }
            .section {
                background: white;
                margin-bottom: 25px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            }
            .section-header {
                background: #f8f9fa;
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
            }
            .section-header h2 {
                margin: 0;
                color: #495057;
                font-size: 1.5em;
            }
            .section-content {
                padding: 25px;
            }
            .overview {
                font-size: 1.1em;
                line-height: 1.8;
                color: #495057;
            }
            .insight-item, .trend-item, .anomaly-item, .suggestion-item {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid;
            }
            .insight-item {
                background: #fff3cd;
                border-left-color: #ffc107;
            }
            .trend-item {
                background: #d1ecf1;
                border-left-color: #17a2b8;
            }
            .trend-positive { border-left-color: #28a745; background: #d4edda; }
            .trend-negative { border-left-color: #dc3545; background: #f8d7da; }
            .anomaly-item {
                background: #f8d7da;
                border-left-color: #dc3545;
            }
            .anomaly-medium { border-left-color: #fd7e14; background: #fff3cd; }
            .anomaly-low { border-left-color: #ffc107; background: #fff3cd; }
            .suggestion-item {
                background: #d1ecf1;
                border-left-color: #17a2b8;
            }
            .suggestion-high { border-left-color: #dc3545; background: #f8d7da; }
            .item-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 1.1em;
            }
            .item-meta {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 8px;
            }
            .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: bold;
                margin-right: 8px;
            }
            .badge-high { background: #dc3545; color: white; }
            .badge-medium { background: #fd7e14; color: white; }
            .badge-low { background: #ffc107; color: black; }
            .badge-positive { background: #28a745; color: white; }
            .badge-negative { background: #dc3545; color: white; }
            .badge-neutral { background: #6c757d; color: white; }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 AI Data Analysis Summary</h1>
            <p>Generated on ${new Date(summary.generatedAt).toLocaleDateString()} for ${dataSource.fileName}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${summary.statistics.totalDataPoints.toLocaleString()}</div>
                <div class="stat-label">Data Points</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.statistics.completenessScore}%</div>
                <div class="stat-label">Completeness</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.statistics.qualityScore}%</div>
                <div class="stat-label">Quality Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.statistics.diversityScore}%</div>
                <div class="stat-label">Diversity</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📊 Overview</h2>
            </div>
            <div class="section-content">
                <div class="overview">${summary.overview}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>💡 Key Insights</h2>
            </div>
            <div class="section-content">
                ${summary.keyInsights
                  .map(
                    (insight: string, index: number) => `
                    <div class="insight-item">
                        <div class="item-title">${index + 1}. Key Insight</div>
                        <div>${insight}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📈 Identified Trends</h2>
            </div>
            <div class="section-content">
                ${summary.trends
                  .map(
                    (trend: any) => `
                    <div class="trend-item trend-${trend.type}">
                        <div class="item-title">${trend.title}</div>
                        <div class="item-meta">
                            <span class="badge badge-${trend.type}">${trend.type}</span>
                            <span class="badge badge-neutral">${trend.confidence}% confidence</span>
                        </div>
                        <div>${trend.description}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>⚠️ Detected Anomalies</h2>
            </div>
            <div class="section-content">
                ${summary.anomalies
                  .map(
                    (anomaly: any) => `
                    <div class="anomaly-item anomaly-${anomaly.severity}">
                        <div class="item-title">${anomaly.title}</div>
                        <div class="item-meta">
                            <span class="badge badge-${anomaly.severity}">${anomaly.severity} severity</span>
                            <span class="badge badge-neutral">${anomaly.location}</span>
                        </div>
                        <div>${anomaly.description}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>🎯 AI Recommendations</h2>
            </div>
            <div class="section-content">
                ${summary.suggestions
                  .map(
                    (suggestion: any) => `
                    <div class="suggestion-item suggestion-${suggestion.priority}">
                        <div class="item-title">${suggestion.title}</div>
                        <div class="item-meta">
                            <span class="badge badge-${suggestion.priority}">${suggestion.priority} priority</span>
                            <span class="badge badge-neutral">${suggestion.category}</span>
                        </div>
                        <div>${suggestion.description}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>

        <div class="footer">
            <p>This AI-powered analysis was generated using advanced machine learning algorithms.<br>
            For questions or additional analysis, please consult with a data analyst.</p>
        </div>
    </body>
    </html>
  `
}
