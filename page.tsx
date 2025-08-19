'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, PlusIcon, SearchIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon, Trash2, Pencil, Download } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string // yyyy-mm-dd
  createdAt: number
}

interface Budget {
  total: number
  categories: Record<string, number>
}

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', emoji: '🍽️', color: '#ef4444' },
  { id: 'transport', name: 'Transport', emoji: '🚗', color: '#3b82f6' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { id: 'bills', name: 'Bills & Utilities', emoji: '⚡', color: '#eab308' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#8b5cf6' },
  { id: 'health', name: 'Health & Fitness', emoji: '🏥', color: '#10b981' },
  { id: 'education', name: 'Education', emoji: '📚', color: '#6366f1' },
  { id: 'travel', name: 'Travel', emoji: '✈️', color: '#06b6d4' },
  { id: 'misc', name: 'Miscellaneous', emoji: '📦', color: '#6b7280' },
]

const LS_EXPENSES_KEY = 'ohara_clone_expenses'
const LS_BUDGET_KEY = 'ohara_clone_budget'

export default function ExpenseTrackerClone(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budget, setBudget] = useState<Budget>({ total: 50000, categories: {} })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // add/edit dialog
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    try {
      const e = localStorage.getItem(LS_EXPENSES_KEY)
      const b = localStorage.getItem(LS_BUDGET_KEY)
      if (e) setExpenses(JSON.parse(e))
      if (b) setBudget(JSON.parse(b))
    } catch (err) {
      console.error('Failed to parse saved data', err)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_EXPENSES_KEY, JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem(LS_BUDGET_KEY, JSON.stringify(budget))
  }, [budget])

  const currentMonthExpenses = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return expenses.filter((e) => {
      const d = new Date(e.date)
      return d.getFullYear() === y && d.getMonth() === m
    })
  }, [expenses])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return currentMonthExpenses.filter((e) => {
      const matchesSearch = !term || e.description.toLowerCase().includes(term) || e.category.toLowerCase().includes(term)
      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [currentMonthExpenses, searchTerm, selectedCategory])

  const totalSpent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const budgetUsed = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0

  const categoryTotals = useMemo(() => {
    const out: Record<string, number> = {}
    currentMonthExpenses.forEach((e) => {
      out[e.category] = (out[e.category] || 0) + e.amount
    })
    return out
  }, [currentMonthExpenses])

  function fmt(amount: number) {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }

  function catInfo(id: string) {
    return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
  }

  function resetForm() {
    setForm({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
  }

  function openAdd() {
    resetForm()
    setOpen(true)
  }

  function openEdit(e: Expense) {
    setForm({ amount: String(e.amount), category: e.category, description: e.description, date: e.date })
    setEditingId(e.id)
    setOpen(true)
  }

  function saveExpense() {
    const amount = Number(form.amount)
    if (!form.description || form.description.trim().length < 2) return
    if (!form.category) return
    if (!Number.isFinite(amount) || amount <= 0) return

    if (editingId) {
      setExpenses((prev) => prev.map((e) => (e.id === editingId ? { ...e, amount, category: form.category, description: form.description.trim(), date: form.date } : e)))
    } else {
      const exp: Expense = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        amount,
        category: form.category,
        description: form.description.trim(),
        date: form.date,
        createdAt: Date.now(),
      }
      setExpenses((p) => [exp, ...p])
    }
    setOpen(false)
    resetForm()
  }

  function deleteExpense(id: string) {
    setExpenses((p) => p.filter((e) => e.id !== id))
  }

  function exportCSV() {
    const headers = ['id', 'amount', 'category', 'description', 'date', 'createdAt']
    const rows = expenses.map((e) => [e.id, e.amount, e.category, JSON.stringify(e.description), e.date, e.createdAt])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const pieData = CATEGORIES.map((c) => ({ name: c.name, value: categoryTotals[c.id] || 0, color: c.color }))

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <WalletIcon className="h-8 w-8 text-blue-600" />
                Monthly Expenses (Ohara-Style)
              </h1>
              <p className="text-gray-600 mt-1">Track and manage your monthly spending</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportCSV()}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" /> Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-2">
                                <span>{c.emoji}</span>
                                <span>{c.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="What did you spend on?"
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveExpense}>{editingId ? 'Save Changes' : 'Add Expense'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Budget</CardTitle>
              <CardDescription>Your spending limit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{fmt(budget.total)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newBudget = prompt('Enter monthly budget (₹):', budget.total.toString())
                      if (newBudget && !isNaN(Number(newBudget))) {
                        setBudget((p) => ({ ...p, total: Math.max(0, Number(newBudget)) }))
                      }
                    }}
                  >
                    Edit
                  </Button>
                </div>
                <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
                <p className="text-sm text-gray-600">{budgetUsed.toFixed(1)}% used</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Spent</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{fmt(totalSpent)}</div>
                <div className="flex items-center gap-1">
                  {budgetUsed > 100 ? (
                    <TrendingUpIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm ${budgetUsed > 100 ? 'text-red-500' : 'text-green-500'}`}>
                    {budgetUsed > 100 ? 'Over budget' : 'Within budget'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Remaining</CardTitle>
              <CardDescription>Available to spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{fmt(Math.max(0, (budget.total || 0) - totalSpent))}</div>
                <p className="text-sm text-gray-600">{currentMonthExpenses.length} transactions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            {/* Search + Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <span>{c.emoji}</span>
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <p className="text-gray-500 text-lg">No expenses found</p>
                    <p className="text-gray-400 text-sm mt-2">{searchTerm || selectedCategory !== 'all' ? 'Try adjusting your search or filters' : 'Start by adding your first expense'}</p>
                  </CardContent>
                </Card>
              ) : (
                filtered.map((e) => {
                  const c = catInfo(e.category)
                  return (
                    <Card key={e.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: c.color }}>
                              {c.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 truncate">{e.description}</h3>
                                  <p className="text-sm text-gray-600">{c.name}</p>
                                  <p className="text-xs text-gray-400 mt-1">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg text-gray-900">{fmt(e.amount)}</div>
                                  <div className="flex justify-end gap-1 mt-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)} className="hover:bg-blue-50">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(e.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Per-category cards + budget bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((c) => {
                const spent = categoryTotals[c.id] || 0
                const catBudget = budget.categories?.[c.id] || 0
                const pctOfTotal = totalSpent > 0 ? (spent / totalSpent) * 100 : 0
                const pctOfCatBudget = catBudget > 0 ? Math.min((spent / catBudget) * 100, 100) : 0
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: c.color }}>
                          {c.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{c.name}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const val = prompt(`Set monthly budget for ${c.name} (₹):`, String(catBudget || ''))
                                if (val !== null) {
                                  const n = Number(val)
                                  if (Number.isFinite(n) && n >= 0) {
                                    setBudget((p) => ({ ...p, categories: { ...p.categories, [c.id]: n } }))
                                  }
                                }
                              }}
                            >
                              Set Budget
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">{pctOfTotal.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Spent</span>
                          <span className="font-semibold">{fmt(spent)}</span>
                        </div>
                        <Progress value={pctOfTotal} className="h-2" />
                        <div className="flex justify-between items-center text-sm pt-2">
                          <span className="text-gray-600">Category Budget</span>
                          <span className="font-semibold">{catBudget ? fmt(catBudget) : '—'}</span>
                        </div>
                        {catBudget > 0 && (
                          <>
                            <Progress value={pctOfCatBudget} className="h-2" />
                            <p className="text-xs text-gray-500">{fmt(Math.max(0, catBudget - spent))} remaining</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Summary</CardTitle>
                  <CardDescription>Your monthly expense breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{currentMonthExpenses.length}</p>
                        <p className="text-sm text-blue-600">Transactions</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{currentMonthExpenses.length > 0 ? fmt(totalSpent / currentMonthExpenses.length) : '₹0'}</p>
                        <p className="text-sm text-green-600">Avg per transaction</p>
                      </div>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Top Categories</h4>
                      {Object.entries(categoryTotals)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([id, amount]) => {
                          const c = catInfo(id)
                          const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                          return (
                            <div key={id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{c.emoji}</span>
                                <span className="text-sm">{c.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{fmt(amount)}</div>
                                <div className="text-xs text-gray-500">{pct.toFixed(1)}%</div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Health</CardTitle>
                  <CardDescription>How you're tracking against your budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2" style={{ color: budgetUsed > 100 ? '#ef4444' : '#10b981' }}>
                        {budgetUsed.toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Budget Used</p>
                    </div>

                    <Progress value={Math.min(budgetUsed, 100)} className="h-4" />

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{fmt(Math.max(0, budget.total - totalSpent))}</p>
                        <p className="text-xs text-gray-500">Remaining</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{Math.max(0, 31 - new Date().getDate())}</p>
                        <p className="text-xs text-gray-500">Days left</p>
                      </div>
                    </div>

                    {budgetUsed > 80 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          {budgetUsed > 100 ? '⚠️ You\'ve exceeded your monthly budget!' : '⚠️ You\'re nearing your budget limit. Consider reducing spending.'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
