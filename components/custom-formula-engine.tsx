"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import {
  Calculator,
  Plus,
  Save,
  Play,
  AlertTriangle,
  CheckCircle,
  Code,
  BookOpen,
  Lightbulb,
  X,
  Copy,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface FormulaEngineProps {
  data: {
    headers: string[]
    data: any[][]
    fileName: string
    sheetName: string
    totalRows: number
  }
  onDataUpdate?: (newData: any) => void
}

interface Formula {
  id: string
  name: string
  expression: string
  description: string
  isValid: boolean
  error?: string
  result?: any[]
  createdAt: string
}

interface FormulaFunction {
  name: string
  syntax: string
  description: string
  example: string
  category: string
}

const FORMULA_FUNCTIONS: FormulaFunction[] = [
  // Mathematical Functions
  {
    name: "SUM",
    syntax: "SUM(column)",
    description: "Sum all values in a column",
    example: "SUM(Sales)",
    category: "Math",
  },
  { name: "AVG", syntax: "AVG(column)", description: "Average of all values", example: "AVG(Price)", category: "Math" },
  {
    name: "MIN",
    syntax: "MIN(column)",
    description: "Minimum value in column",
    example: "MIN(Cost)",
    category: "Math",
  },
  {
    name: "MAX",
    syntax: "MAX(column)",
    description: "Maximum value in column",
    example: "MAX(Revenue)",
    category: "Math",
  },
  {
    name: "COUNT",
    syntax: "COUNT(column)",
    description: "Count non-empty values",
    example: "COUNT(Orders)",
    category: "Math",
  },
  {
    name: "ROUND",
    syntax: "ROUND(value, decimals)",
    description: "Round to specified decimals",
    example: "ROUND(Price, 2)",
    category: "Math",
  },
  { name: "ABS", syntax: "ABS(value)", description: "Absolute value", example: "ABS(Profit)", category: "Math" },
  { name: "SQRT", syntax: "SQRT(value)", description: "Square root", example: "SQRT(Area)", category: "Math" },
  {
    name: "POWER",
    syntax: "POWER(base, exponent)",
    description: "Raise to power",
    example: "POWER(Sales, 2)",
    category: "Math",
  },

  // Logical Functions
  {
    name: "IF",
    syntax: "IF(condition, true_value, false_value)",
    description: "Conditional logic",
    example: "IF(Sales > 1000, 'High', 'Low')",
    category: "Logic",
  },
  {
    name: "AND",
    syntax: "AND(condition1, condition2)",
    description: "Logical AND",
    example: "AND(Sales > 100, Cost < 50)",
    category: "Logic",
  },
  {
    name: "OR",
    syntax: "OR(condition1, condition2)",
    description: "Logical OR",
    example: "OR(Status = 'Active', Priority = 'High')",
    category: "Logic",
  },
  {
    name: "NOT",
    syntax: "NOT(condition)",
    description: "Logical NOT",
    example: "NOT(Status = 'Inactive')",
    category: "Logic",
  },

  // String Functions
  {
    name: "CONCAT",
    syntax: "CONCAT(text1, text2)",
    description: "Concatenate strings",
    example: "CONCAT(FirstName, ' ', LastName)",
    category: "Text",
  },
  {
    name: "UPPER",
    syntax: "UPPER(text)",
    description: "Convert to uppercase",
    example: "UPPER(Category)",
    category: "Text",
  },
  {
    name: "LOWER",
    syntax: "LOWER(text)",
    description: "Convert to lowercase",
    example: "LOWER(Email)",
    category: "Text",
  },
  { name: "LEN", syntax: "LEN(text)", description: "Length of text", example: "LEN(Description)", category: "Text" },
  {
    name: "LEFT",
    syntax: "LEFT(text, count)",
    description: "Left characters",
    example: "LEFT(Code, 3)",
    category: "Text",
  },
  {
    name: "RIGHT",
    syntax: "RIGHT(text, count)",
    description: "Right characters",
    example: "RIGHT(Phone, 4)",
    category: "Text",
  },

  // Date Functions
  { name: "TODAY", syntax: "TODAY()", description: "Current date", example: "TODAY()", category: "Date" },
  { name: "YEAR", syntax: "YEAR(date)", description: "Extract year", example: "YEAR(OrderDate)", category: "Date" },
  { name: "MONTH", syntax: "MONTH(date)", description: "Extract month", example: "MONTH(OrderDate)", category: "Date" },
  { name: "DAY", syntax: "DAY(date)", description: "Extract day", example: "DAY(OrderDate)", category: "Date" },
]

export default function CustomFormulaEngine({ data, onDataUpdate }: FormulaEngineProps) {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [currentFormula, setCurrentFormula] = useState({
    name: "",
    expression: "",
    description: "",
  })
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFunctionLibrary, setShowFunctionLibrary] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load saved formulas
  useEffect(() => {
    loadFormulas()
  }, [])

  const loadFormulas = async () => {
    try {
      const response = await fetch("/api/formulas")
      if (response.ok) {
        const savedFormulas = await response.json()
        setFormulas(savedFormulas)
      }
    } catch (error) {
      console.error("Failed to load formulas:", error)
    }
  }

  const filteredFunctions = useMemo(() => {
    return FORMULA_FUNCTIONS.filter((func) => {
      const matchesCategory = selectedCategory === "All" || func.category === selectedCategory
      const matchesSearch =
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchTerm])

  const categories = useMemo(() => {
    const cats = ["All", ...new Set(FORMULA_FUNCTIONS.map((f) => f.category))]
    return cats
  }, [])

  const insertFunction = (func: FormulaFunction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.expression
    const before = text.substring(0, start)
    const after = text.substring(end)

    const newText = before + func.syntax + after
    setCurrentFormula((prev) => ({ ...prev, expression: newText }))

    // Set cursor position after the inserted function
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + func.syntax.length, start + func.syntax.length)
    }, 0)
  }

  const insertColumnReference = (columnName: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.expression
    const before = text.substring(0, start)
    const after = text.substring(end)

    const newText = before + `[${columnName}]` + after
    setCurrentFormula((prev) => ({ ...prev, expression: newText }))

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + columnName.length + 2, start + columnName.length + 2)
    }, 0)
  }

  const validateFormula = async (expression: string) => {
    try {
      const response = await fetch("/api/formulas/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression,
          headers: data.headers,
          sampleData: data.data.slice(0, 5), // Use sample for validation
        }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return { isValid: false, error: "Validation failed" }
    }
  }

  const evaluateFormula = async () => {
    if (!currentFormula.expression.trim()) {
      setError("Please enter a formula expression")
      return
    }

    setIsEvaluating(true)
    setError(null)
    setEvaluationResult(null)

    try {
      const response = await fetch("/api/formulas/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression: currentFormula.expression,
          headers: data.headers,
          data: data.data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Evaluation failed")
      }

      setEvaluationResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsEvaluating(false)
    }
  }

  const saveFormula = async () => {
    if (!currentFormula.name.trim()) {
      setError("Please enter a formula name")
      return
    }

    if (!evaluationResult) {
      setError("Please evaluate the formula first")
      return
    }

    try {
      const response = await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentFormula.name,
          expression: currentFormula.expression,
          description: currentFormula.description,
          result: evaluationResult.result,
          fileName: data.fileName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save formula")
      }

      const savedFormula = await response.json()
      setFormulas((prev) => [...prev, savedFormula])

      // Reset form
      setCurrentFormula({ name: "", expression: "", description: "" })
      setEvaluationResult(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save formula")
    }
  }

  const addCalculatedColumn = async () => {
    if (!evaluationResult || !currentFormula.name.trim()) {
      setError("Please evaluate and name the formula first")
      return
    }

    try {
      const response = await fetch("/api/formulas/add-column", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnName: currentFormula.name,
          expression: currentFormula.expression,
          result: evaluationResult.result,
          headers: data.headers,
          data: data.data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add calculated column")
      }

      const updatedData = await response.json()

      // Update parent component with new data
      if (onDataUpdate) {
        onDataUpdate(updatedData)
      }

      // Save formula and reset
      await saveFormula()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add calculated column")
    }
  }

  const deleteFormula = async (formulaId: string) => {
    try {
      const response = await fetch(`/api/formulas/${formulaId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFormulas((prev) => prev.filter((f) => f.id !== formulaId))
      }
    } catch (error) {
      console.error("Failed to delete formula:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Formula Builder */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              <CardTitle>Custom Formula Engine</CardTitle>
            </div>
            <Dialog open={showFunctionLibrary} onOpenChange={setShowFunctionLibrary}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Function Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Formula Function Library</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Search functions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <ScrollArea className="h-96">
                    <div className="grid gap-3">
                      {filteredFunctions.map((func) => (
                        <Card
                          key={func.name}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => insertFunction(func)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{func.category}</Badge>
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{func.name}</code>
                              </div>
                              <p className="text-sm text-gray-600">{func.description}</p>
                              <div className="text-xs text-gray-500">
                                <strong>Syntax:</strong> <code>{func.syntax}</code>
                              </div>
                              <div className="text-xs text-gray-500">
                                <strong>Example:</strong> <code>{func.example}</code>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-600">
            Create custom formulas to calculate new columns from your existing data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formula-name">Formula Name</Label>
                <Input
                  id="formula-name"
                  placeholder="e.g., Profit Margin"
                  value={currentFormula.name}
                  onChange={(e) => setCurrentFormula((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formula-expression">Formula Expression</Label>
                <Textarea
                  ref={textareaRef}
                  id="formula-expression"
                  placeholder="e.g., [Sales] - [Cost]"
                  value={currentFormula.expression}
                  onChange={(e) => setCurrentFormula((prev) => ({ ...prev, expression: e.target.value }))}
                  className="font-mono text-sm min-h-24"
                />
                <div className="text-xs text-gray-500">
                  Use [Column Name] to reference columns. Start with = for Excel-style formulas.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formula-description">Description (Optional)</Label>
                <Input
                  id="formula-description"
                  placeholder="Brief description of what this formula calculates"
                  value={currentFormula.description}
                  onChange={(e) => setCurrentFormula((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Available Columns</Label>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 gap-1">
                    {data.headers.map((header, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 text-xs"
                        onClick={() => insertColumnReference(header)}
                      >
                        <Code className="h-3 w-3 mr-2" />
                        {header}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={evaluateFormula}
                  disabled={!currentFormula.expression.trim() || isEvaluating}
                  className="flex-1"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test Formula
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {evaluationResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Formula evaluated successfully! {evaluationResult.validResults} of {evaluationResult.totalRows} rows
                  calculated.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={addCalculatedColumn} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add as New Column
                </Button>
                <Button onClick={saveFormula} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Formula
                </Button>
              </div>

              {/* Preview Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Formula Results Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Row</TableHead>
                            <TableHead className="font-semibold">Result</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evaluationResult.result.slice(0, 10).map((result: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {result.error ? (
                                  <span className="text-red-600">Error</span>
                                ) : (
                                  <span className="font-mono">{result.value?.toString() || "N/A"}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {result.error ? (
                                  <Badge variant="destructive">Error</Badge>
                                ) : (
                                  <Badge variant="default">Success</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {evaluationResult.result.length > 10 && (
                      <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                        Showing first 10 of {evaluationResult.result.length} results
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Saved Formulas */}
      {formulas.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Saved Formulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {formulas.map((formula) => (
                <motion.div
                  key={formula.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{formula.name}</h4>
                        <Badge variant={formula.isValid ? "default" : "destructive"}>
                          {formula.isValid ? "Valid" : "Error"}
                        </Badge>
                      </div>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded block">{formula.expression}</code>
                      {formula.description && <p className="text-sm text-gray-600">{formula.description}</p>}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(formula.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setCurrentFormula({
                            name: formula.name,
                            expression: formula.expression,
                            description: formula.description,
                          })
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteFormula(formula.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
