"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Html } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ChartConfig } from "./chart-generator"
import type * as THREE from "three"

interface Chart3DProps {
  config: ChartConfig
  data: Array<{ x: any; y: any }>
}

function Column({ position, height, color, label, value }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html position={[0, height + 0.5, 0]} center>
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow-lg">{value}</div>
      </Html>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="#333"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>
    </group>
  )
}

function Scene({ config, data }: { config: ChartConfig; data: Array<{ x: any; y: any }> }) {
  // Prepare data for 3D visualization
  const chartData = data.slice(0, 20) // Limit for performance
  const maxValue = Math.max(...chartData.map((item) => Number(item.y) || 0))
  const minValue = Math.min(...chartData.map((item) => Number(item.y) || 0))
  const range = maxValue - minValue || 1

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {chartData.map((item, index) => {
        const value = Number(item.y) || 0
        const normalizedHeight = ((value - minValue) / range) * 5 + 0.5 // Scale to 0.5-5.5
        const x = (index - chartData.length / 2) * 1.5
        const color = config.colors[index % config.colors.length]

        return (
          <Column
            key={index}
            position={[x, 0, 0]}
            height={normalizedHeight}
            color={color}
            label={item.x.toString().substring(0, 8)}
            value={value.toFixed(1)}
          />
        )
      })}

      {/* Grid */}
      <gridHelper args={[30, 30, "#cccccc", "#eeeeee"]} position={[0, 0, 0]} />

      {/* Axis labels */}
      <Text position={[0, 0, -8]} fontSize={0.5} color="#666" anchorX="center">
        {config.xAxisLabel}
      </Text>
      <Text position={[-10, 3, 0]} fontSize={0.5} color="#666" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        {config.yAxisLabel}
      </Text>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

export default function Chart3D({ config, data }: Chart3DProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">{config.title || "3D Column Chart"}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">3D Chart</Badge>
            <Badge variant="secondary">{Math.min(data.length, 20)} columns</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full bg-gradient-to-b from-blue-50 to-white rounded-lg overflow-hidden">
          <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
            <Scene config={config} data={data} />
          </Canvas>
        </div>
        <div className="mt-4 text-sm text-gray-600 text-center">
          {config.xAxisLabel} vs {config.yAxisLabel}
          {data.length > 20 && " (showing first 20 data points)"}
          <br />
          <span className="text-xs">Use mouse to rotate, zoom, and pan the 3D chart</span>
        </div>
      </CardContent>
    </Card>
  )
}
