"use client"

import { useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Bar, Line, Pie } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ChartConfig } from "./chart-generator"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

interface Chart2DProps {
  config: ChartConfig
  data: Array<{ x: any; y: any }>
}

export default function Chart2D({ config, data }: Chart2DProps) {
  const chartRef = useRef<any>(null)

  // Prepare data based on chart type
  const prepareChartData = () => {
    if (config.type === "pie") {
      // For pie charts, aggregate data by x values
      const aggregated = data.reduce(
        (acc, item) => {
          const key = item.x.toString()
          acc[key] = (acc[key] || 0) + (Number(item.y) || 1)
          return acc
        },
        {} as Record<string, number>,
      )

      const labels = Object.keys(aggregated).slice(0, 10) // Limit to 10 slices
      const values = labels.map((label) => aggregated[label])

      return {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: config.colors.slice(0, labels.length),
            borderColor: config.colors.slice(0, labels.length).map((color) => color + "CC"),
            borderWidth: 2,
          },
        ],
      }
    } else {
      // For bar and line charts
      const limitedData = data.slice(0, 50) // Limit for performance
      const labels = limitedData.map((item) => item.x.toString())
      const values = limitedData.map((item) => Number(item.y) || 0)

      return {
        labels,
        datasets: [
          {
            label: config.yAxisLabel,
            data: values,
            backgroundColor: config.type === "bar" ? config.colors[0] + "80" : "transparent",
            borderColor: config.colors[0],
            borderWidth: 2,
            fill: config.type === "line" ? false : true,
            tension: config.type === "line" ? 0.4 : 0,
            pointBackgroundColor: config.colors[0],
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: config.type === "line" ? 4 : 0,
          },
        ],
      }
    }
  }

  const chartData = prepareChartData()

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: config.animation
      ? {
          duration: 1000,
          easing: "easeInOutQuart",
        }
      : false,
    plugins: {
      legend: {
        display: config.showLegend,
        position: "top" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: !!config.title,
        text: config.title,
        font: {
          size: 18,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: config.colors[0],
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales:
      config.type !== "pie"
        ? {
            x: {
              display: true,
              title: {
                display: !!config.xAxisLabel,
                text: config.xAxisLabel,
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
              grid: {
                display: config.showGrid,
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            y: {
              display: true,
              title: {
                display: !!config.yAxisLabel,
                text: config.yAxisLabel,
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
              grid: {
                display: config.showGrid,
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
          }
        : undefined,
  }

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />
      case "line":
        return <Line ref={chartRef} data={chartData} options={chartOptions} />
      case "pie":
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />
      default:
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">{config.title || "Generated Chart"}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {config.type} Chart
            </Badge>
            <Badge variant="secondary">{data.length} data points</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">{renderChart()}</div>
        <div className="mt-4 text-sm text-gray-600 text-center">
          {config.xAxisLabel} vs {config.yAxisLabel}
          {data.length > 50 && config.type !== "pie" && " (showing first 50 data points)"}
          {data.length > 10 && config.type === "pie" && " (showing top 10 categories)"}
        </div>
      </CardContent>
    </Card>
  )
}
