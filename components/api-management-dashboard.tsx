"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Globe,
  Key,
  Webhook,
  BarChart3,
  Shield,
  Plus,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
  TrendingUp,
  Search,
  MoreHorizontal,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  isActive: boolean
  createdAt: string
  lastUsed: string
  usageCount: number
  expiresAt?: string
}

interface WebhookType {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  createdAt: string
  lastTriggered?: string
  successCount: number
  failureCount: number
  retryCount: number
}

interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  topEndpoints: Array<{ endpoint: string; count: number }>
  dailyUsage: Array<{ date: string; requests: number; success: number; errors: number }>
  rateLimitHits: number
  uniqueUsers: number
}

export default function APIManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookType[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API Key Management State
  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false)
  const [isEditKeyDialogOpen, setIsEditKeyDialogOpen] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | null>(null)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    permissions: [] as string[],
    rateLimit: 1000,
    expiresAt: "",
  })

  // Webhook Management State
  const [isCreateWebhookDialogOpen, setIsCreateWebhookDialogOpen] = useState(false)
  const [isEditWebhookDialogOpen, setIsEditWebhookDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookType | null>(null)
  const [newWebhookData, setNewWebhookData] = useState({
    name: "",
    url: "",
    events: [] as string[],
  })

  // Filters and Search
  const [keySearchTerm, setKeySearchTerm] = useState("")
  const [webhookSearchTerm, setWebhookSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadAPIData()
  }, [])

  const loadAPIData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [keysRes, webhooksRes, statsRes] = await Promise.all([
        fetch("/api/admin/api-keys"),
        fetch("/api/admin/webhooks"),
        fetch("/api/admin/usage-stats"),
      ])

      if (!keysRes.ok || !webhooksRes.ok || !statsRes.ok) {
        throw new Error("Failed to load API data")
      }

      const [keysData, webhooksData, statsData] = await Promise.all([
        keysRes.json(),
        webhooksRes.json(),
        statsRes.json(),
      ])

      setApiKeys(keysData)
      setWebhooks(webhooksData)
      setUsageStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAPIKey = async () => {
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newKeyData),
      })

      if (!response.ok) {
        throw new Error("Failed to create API key")
      }

      const newKey = await response.json()
      setApiKeys((prev) => [...prev, newKey])
      setIsCreateKeyDialogOpen(false)
      setNewKeyData({ name: "", permissions: [], rateLimit: 1000, expiresAt: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key")
    }
  }

  const handleToggleAPIKey = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle API key")
      }

      setApiKeys((prev) => prev.map((key) => (key.id === keyId ? { ...key, isActive: !isActive } : key)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle API key")
    }
  }

  const handleDeleteAPIKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      setApiKeys((prev) => prev.filter((key) => key.id !== keyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key")
    }
  }

  const handleCreateWebhook = async () => {
    try {
      const response = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWebhookData),
      })

      if (!response.ok) {
        throw new Error("Failed to create webhook")
      }

      const newWebhook = await response.json()
      setWebhooks((prev) => [...prev, newWebhook])
      setIsCreateWebhookDialogOpen(false)
      setNewWebhookData({ name: "", url: "", events: [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook")
    }
  }

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle webhook")
      }

      setWebhooks((prev) =>
        prev.map((webhook) => (webhook.id === webhookId ? { ...webhook, isActive: !isActive } : webhook)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle webhook")
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}/test`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to test webhook")
      }

      // Show success message or update UI
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test webhook")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show toast notification
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSuccessRate = (success: number, total: number): number => {
    return total > 0 ? Math.round((success / total) * 100) : 0
  }

  const filteredAPIKeys = apiKeys.filter((key) => {
    const matchesSearch = key.name.toLowerCase().includes(keySearchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? key.isActive : !key.isActive)
    return matchesSearch && matchesStatus
  })

  const filteredWebhooks = webhooks.filter((webhook) => {
    const matchesSearch =
      webhook.name.toLowerCase().includes(webhookSearchTerm.toLowerCase()) ||
      webhook.url.toLowerCase().includes(webhookSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? webhook.isActive : !webhook.isActive)
    return matchesSearch && matchesStatus
  })

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <div className="font-semibold">Loading API Management</div>
              <div className="text-sm text-gray-600">Please wait...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Globe className="h-6 w-6" />
                API Management Dashboard
              </CardTitle>
              <p className="text-blue-100 mt-1">Manage API keys, webhooks, and monitor usage analytics</p>
            </div>
            <Button onClick={loadAPIData} variant="secondary" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys ({apiKeys.length})
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks ({webhooks.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {usageStats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Requests</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {usageStats.totalRequests.toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-700">
                            {getSuccessRate(usageStats.successfulRequests, usageStats.totalRequests)}% success rate
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Active API Keys</p>
                          <p className="text-2xl font-bold text-green-900">
                            {apiKeys.filter((key) => key.isActive).length}
                          </p>
                          <p className="text-xs text-green-700">{apiKeys.length} total keys</p>
                        </div>
                        <Key className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Active Webhooks</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {webhooks.filter((webhook) => webhook.isActive).length}
                          </p>
                          <p className="text-xs text-purple-700">{webhooks.length} total webhooks</p>
                        </div>
                        <Webhook className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Avg Response Time</p>
                          <p className="text-2xl font-bold text-orange-900">{usageStats.averageResponseTime}ms</p>
                          <p className="text-xs text-orange-700">{usageStats.uniqueUsers} unique users</p>
                        </div>
                        <Zap className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Usage Chart */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    API Usage Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageStats.dailyUsage}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="requests"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="success"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Endpoints */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Top API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {usageStats.topEndpoints.map((endpoint, index) => (
                      <div
                        key={endpoint.endpoint}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium font-mono text-sm">{endpoint.endpoint}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{endpoint.count.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">requests</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-6">
          <div className="space-y-6">
            {/* API Keys Header */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search API keys..."
                        value={keySearchTerm}
                        onChange={(e) => setKeySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isCreateKeyDialogOpen} onOpenChange={setIsCreateKeyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New API Key</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Key Name</Label>
                          <Input
                            value={newKeyData.name}
                            onChange={(e) => setNewKeyData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter key name..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rate Limit (requests/hour)</Label>
                          <Input
                            type="number"
                            value={newKeyData.rateLimit}
                            onChange={(e) => setNewKeyData((prev) => ({ ...prev, rateLimit: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiration Date (Optional)</Label>
                          <Input
                            type="datetime-local"
                            value={newKeyData.expiresAt}
                            onChange={(e) => setNewKeyData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsCreateKeyDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateAPIKey}>Create Key</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {filteredAPIKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Key className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No API Keys Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      No API keys match your current filters. Try adjusting your search criteria or create a new API
                      key.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Key Details</TableHead>
                          <TableHead className="font-semibold">Permissions & Limits</TableHead>
                          <TableHead className="font-semibold">Usage Stats</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAPIKeys.map((apiKey, index) => (
                          <motion.tr
                            key={apiKey.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{apiKey.name}</div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {apiKey.key.substring(0, 8)}...
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(apiKey.key)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-500">Created: {formatDate(apiKey.createdAt)}</div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-gray-600">Rate Limit:</span> {apiKey.rateLimit}/hour
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {apiKey.permissions.map((permission) => (
                                    <Badge key={permission} variant="outline" className="text-xs">
                                      {permission}
                                    </Badge>
                                  ))}
                                </div>
                                {apiKey.expiresAt && (
                                  <div className="text-xs text-orange-600">Expires: {formatDate(apiKey.expiresAt)}</div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-gray-600">Usage:</span> {apiKey.usageCount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Last used: {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "Never"}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs ${
                                    apiKey.isActive
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                                >
                                  {apiKey.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Switch
                                  checked={apiKey.isActive}
                                  onCheckedChange={() => handleToggleAPIKey(apiKey.id, apiKey.isActive)}
                                />
                              </div>
                            </TableCell>

                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => copyToClipboard(apiKey.key)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Key
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApiKey(apiKey)
                                      setIsEditKeyDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAPIKey(apiKey.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6">
          <div className="space-y-6">
            {/* Webhooks Header */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search webhooks..."
                        value={webhookSearchTerm}
                        onChange={(e) => setWebhookSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isCreateWebhookDialogOpen} onOpenChange={setIsCreateWebhookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Webhook
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Webhook</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Webhook Name</Label>
                          <Input
                            value={newWebhookData.name}
                            onChange={(e) => setNewWebhookData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter webhook name..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Webhook URL</Label>
                          <Input
                            value={newWebhookData.url}
                            onChange={(e) => setNewWebhookData((prev) => ({ ...prev, url: e.target.value }))}
                            placeholder="https://your-app.com/webhook"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Events</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["upload", "analysis", "chart", "error"].map((event) => (
                              <label key={event} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newWebhookData.events.includes(event)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewWebhookData((prev) => ({
                                        ...prev,
                                        events: [...prev.events, event],
                                      }))
                                    } else {
                                      setNewWebhookData((prev) => ({
                                        ...prev,
                                        events: prev.events.filter((e) => e !== event),
                                      }))
                                    }
                                  }}
                                />
                                <span className="text-sm capitalize">{event}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsCreateWebhookDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateWebhook}>Create Webhook</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks Table */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {filteredWebhooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Webhook className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Webhooks Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      No webhooks match your current filters. Try adjusting your search criteria or create a new
                      webhook.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Webhook Details</TableHead>
                          <TableHead className="font-semibold">Events & URL</TableHead>
                          <TableHead className="font-semibold">Performance</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWebhooks.map((webhook, index) => (
                          <motion.tr
                            key={webhook.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{webhook.name}</div>
                                <div className="text-xs text-gray-500">Created: {formatDate(webhook.createdAt)}</div>
                                {webhook.lastTriggered && (
                                  <div className="text-xs text-gray-500">
                                    Last triggered: {formatDate(webhook.lastTriggered)}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-2">
                                <div className="text-sm font-mono text-blue-600 truncate max-w-xs">{webhook.url}</div>
                                <div className="flex flex-wrap gap-1">
                                  {webhook.events.map((event) => (
                                    <Badge key={event} variant="outline" className="text-xs">
                                      {event}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-sm">{webhook.successCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-sm">{webhook.failureCount}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getSuccessRate(webhook.successCount, webhook.successCount + webhook.failureCount)}%
                                  success
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs ${
                                    webhook.isActive
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                                >
                                  {webhook.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Switch
                                  checked={webhook.isActive}
                                  onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.isActive)}
                                />
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTestWebhook(webhook.id)}
                                  className="h-8"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Test
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedWebhook(webhook)
                                        setIsEditWebhookDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copyToClipboard(webhook.secret)}>
                                      <Key className="h-4 w-4 mr-2" />
                                      Copy Secret
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          {usageStats && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Request Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageStats.dailyUsage}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" stroke="#666" fontSize={12} />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-green-600" />
                      Success vs Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Success", value: usageStats.successfulRequests, color: "#10b981" },
                              { name: "Errors", value: usageStats.failedRequests, color: "#ef4444" },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: "Success", value: usageStats.successfulRequests, color: "#10b981" },
                              { name: "Errors", value: usageStats.failedRequests, color: "#ef4444" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rate Limiting & Security */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Security & Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{usageStats.rateLimitHits}</div>
                      <div className="text-sm text-red-700">Rate Limit Hits</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{usageStats.uniqueUsers}</div>
                      <div className="text-sm text-blue-700">Unique API Users</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{usageStats.averageResponseTime}ms</div>
                      <div className="text-sm text-green-700">Avg Response Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
