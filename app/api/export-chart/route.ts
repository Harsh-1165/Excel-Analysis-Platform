import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import puppeteer from "puppeteer"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { chartConfig, data, format } = await request.json()

    if (format === "png") {
      return await exportAsPNG(chartConfig, data)
    } else if (format === "pdf") {
      return await exportAsPDF(chartConfig, data)
    } else {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

async function exportAsPNG(chartConfig: any, data: any) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })

    // Create HTML content with Chart.js
    const htmlContent = generateChartHTML(chartConfig, data)
    await page.setContent(htmlContent)

    // Wait for chart to render
    await page.waitForTimeout(2000)

    // Take screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 },
    })

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            format: "png",
            public_id: `charts/${chartConfig.name || "chart"}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(screenshot)
    })

    return NextResponse.json({ url: (uploadResult as any).secure_url })
  } finally {
    await browser.close()
  }
}

async function exportAsPDF(chartConfig: any, data: any) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })

    // Create HTML content with Chart.js
    const htmlContent = generateChartHTML(chartConfig, data)
    await page.setContent(htmlContent)

    // Wait for chart to render
    await page.waitForTimeout(2000)

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
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
            public_id: `charts/${chartConfig.name || "chart"}_${Date.now()}`,
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
}

function generateChartHTML(chartConfig: any, data: any) {
  const chartData = prepareDataForExport(chartConfig, data)

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background: ${chartConfig.backgroundColor || "#ffffff"};
            }
            .chart-container {
                width: 1160px;
                height: 760px;
                position: relative;
            }
            canvas {
                max-width: 100%;
                max-height: 100%;
            }
        </style>
    </head>
    <body>
        <div class="chart-container">
            <canvas id="chart"></canvas>
        </div>
        <script>
            const ctx = document.getElementById('chart').getContext('2d');
            const chartData = ${JSON.stringify(chartData)};
            const chartOptions = ${JSON.stringify(generateChartOptions(chartConfig))};
            
            new Chart(ctx, {
                type: '${chartConfig.type === "3d-column" ? "bar" : chartConfig.type}',
                data: chartData,
                options: chartOptions
            });
        </script>
    </body>
    </html>
  `
}

function prepareDataForExport(chartConfig: any, data: any) {
  if (chartConfig.type === "pie") {
    const aggregated = data.reduce((acc: any, item: any) => {
      const key = item.x.toString()
      acc[key] = (acc[key] || 0) + (Number(item.y) || 1)
      return acc
    }, {})

    const labels = Object.keys(aggregated).slice(0, 10)
    const values = labels.map((label) => aggregated[label])

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: chartConfig.colors.slice(0, labels.length),
          borderColor: chartConfig.colors.slice(0, labels.length).map((color: string) => color + "CC"),
          borderWidth: 2,
        },
      ],
    }
  } else {
    const limitedData = data.slice(0, 50)
    const labels = limitedData.map((item: any) => item.x.toString())
    const values = limitedData.map((item: any) => Number(item.y) || 0)

    return {
      labels,
      datasets: [
        {
          label: chartConfig.yAxisLabel,
          data: values,
          backgroundColor: chartConfig.type === "bar" ? chartConfig.colors[0] + "80" : "transparent",
          borderColor: chartConfig.colors[0],
          borderWidth: 2,
          fill: chartConfig.type === "line" ? false : true,
          tension: chartConfig.type === "line" ? 0.4 : 0,
        },
      ],
    }
  }
}

function generateChartOptions(chartConfig: any) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for export
    plugins: {
      legend: {
        display: chartConfig.showLegend,
        position: "top",
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: !!chartConfig.title,
        text: chartConfig.title,
        font: {
          size: 24,
          weight: "bold",
        },
        padding: 30,
      },
    },
    scales:
      chartConfig.type !== "pie"
        ? {
            x: {
              display: true,
              title: {
                display: !!chartConfig.xAxisLabel,
                text: chartConfig.xAxisLabel,
                font: {
                  size: 16,
                  weight: "bold",
                },
              },
              grid: {
                display: chartConfig.showGrid,
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            y: {
              display: true,
              title: {
                display: !!chartConfig.yAxisLabel,
                text: chartConfig.yAxisLabel,
                font: {
                  size: 16,
                  weight: "bold",
                },
              },
              grid: {
                display: chartConfig.showGrid,
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
          }
        : undefined,
  }
}
