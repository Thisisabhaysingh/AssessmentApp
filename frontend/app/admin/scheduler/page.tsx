'use client'
import { useState, useEffect, useRef } from 'react'
import { Filter, Plus, Search, Edit, X, ChevronDown, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'

export default function AdminScheduler() {
  // State for assessments and form data
  const [assessments, setAssessments] = useState<any[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [schoolOpsManagers, setSchoolOpsManagers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  
  // Enhanced filtering and pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [trainerFilter, setTrainerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('scheduled_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [showModal, setShowModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<any>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [assessmentToCancel, setAssessmentToCancel] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    course_id: '',
    trainer_id: '',
    manager_ids: [] as number[],
    school_ops_manager_ids: [] as number[],
    scheduled_date: ''
  })
  
  // Multi-select dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [schoolOpsDropdownOpen, setSchoolOpsDropdownOpen] = useState(false)
  const [managerSearch, setManagerSearch] = useState('')
  const [schoolOpsManagerSearch, setSchoolOpsManagerSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const schoolOpsDropdownRef = useRef<HTMLDivElement>(null)
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (schoolOpsDropdownRef.current && !schoolOpsDropdownRef.current.contains(event.target as Node)) {
        setSchoolOpsDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Manager selection helpers
  const filteredManagers = managers.filter(manager => 
    manager.name.toLowerCase().includes(managerSearch.toLowerCase()) ||
    (manager.department && manager.department.toLowerCase().includes(managerSearch.toLowerCase()))
  )
  
  const selectedManagers = managers.filter(manager => formData.manager_ids.includes(manager.id))
  
  const handleManagerToggle = (managerId: number) => {
    setFormData(prev => ({
      ...prev,
      manager_ids: prev.manager_ids.includes(managerId)
        ? prev.manager_ids.filter(id => id !== managerId)
        : [...prev.manager_ids, managerId]
    }))
  }
  
  // School Ops Manager selection helpers
  const filteredSchoolOpsManagers = schoolOpsManagers.filter(manager => 
    manager.name.toLowerCase().includes(schoolOpsManagerSearch.toLowerCase()) ||
    (manager.department && manager.department.toLowerCase().includes(schoolOpsManagerSearch.toLowerCase()))
  )
  
  const selectedSchoolOpsManagers = schoolOpsManagers.filter(manager => formData.school_ops_manager_ids.includes(manager.id))
  
  const handleSchoolOpsManagerToggle = (managerId: number) => {
    setFormData(prev => ({
      ...prev,
      school_ops_manager_ids: prev.school_ops_manager_ids.includes(managerId)
        ? prev.school_ops_manager_ids.filter(id => id !== managerId)
        : [...prev.school_ops_manager_ids, managerId]
    }))
  }
  
  const removeManager = (managerId: number) => {
    setFormData(prev => ({
      ...prev,
      manager_ids: prev.manager_ids.filter(id => id !== managerId)
    }))
  }
  
  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Add previous month's trailing days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    const prevMonthDays = getDaysInMonth(prevMonth)
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDays - i)
      })
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      })
    }
    
    // Add next month's leading days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      })
    }
    
    return days
  }
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Update form data with selected date
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFormData({ ...formData, scheduled_date: localDateTime })
  }
  
  const handleMonthChange = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction))
  }
  
  // Get assessments for a specific date
  const getAssessmentsForDate = (date: Date) => {
    return assessments.filter(assessment => {
      const assessmentDate = new Date(assessment.scheduled_date)
      return assessmentDate.toDateString() === date.toDateString()
    })
  }
  
  // Enhanced filtering and sorting logic
  const filteredAndSortedAssessments = assessments
    .filter(assessment => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        assessment.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.trainer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.manager?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assessment.assignedManagers && assessment.assignedManagers.some((manager: any) => 
          manager.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter
      
      // Course filter
      const matchesCourse = courseFilter === 'all' || assessment.course_id?.toString() === courseFilter
      
      // Trainer filter
      const matchesTrainer = trainerFilter === 'all' || assessment.trainer_id?.toString() === trainerFilter
      
      // Date filter
      const assessmentDate = new Date(assessment.scheduled_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = assessmentDate >= today && assessmentDate < tomorrow
      } else if (dateFilter === 'week') {
        matchesDate = assessmentDate >= today && assessmentDate < nextWeek
      } else if (dateFilter === 'month') {
        matchesDate = assessmentDate >= today && assessmentDate < nextMonth
      } else if (dateFilter === 'past') {
        matchesDate = assessmentDate < today
      }
      
      return matchesSearch && matchesStatus && matchesCourse && matchesTrainer && matchesDate
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'course':
          aValue = a.course?.name || ''
          bValue = b.course?.name || ''
          break
        case 'trainer':
          aValue = a.trainer?.name || ''
          bValue = b.trainer?.name || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'scheduled_date':
        default:
          aValue = new Date(a.scheduled_date)
          bValue = new Date(b.scheduled_date)
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAssessments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAssessments = filteredAndSortedAssessments.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, courseFilter, trainerFilter, dateFilter, itemsPerPage])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Fetch all required data from backend including managers
  const loadData = async () => {
    try {
      const [assessmentsRes, trainersRes, managersRes, schoolOpsManagersRes, coursesRes]: any[] = await Promise.all([
        api.admin.getAssessments(),
        api.admin.getTrainers(),
        api.admin.getManagers(), // Fetch managers
        api.admin.getSchoolOpsManagers(), // Fetch school ops managers
        api.admin.getCourses()
      ])
      setAssessments(assessmentsRes.data.assessments)
      setTrainers(trainersRes.data.trainers)
      setManagers(managersRes.data.managers) // Set managers
      setSchoolOpsManagers(schoolOpsManagersRes.data) // Set school ops managers
      setCourses(coursesRes.data.courses)
    } catch (error) {
      console.error('Failed to load data:', error)
      setToast({ message: 'Failed to load data', type: 'error' })
    }
  }

  // Handle form submission to create/update assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    if (!formData.course_id || !formData.trainer_id || !formData.scheduled_date) {
      setToast({ message: 'Please fill all fields', type: 'error' })
      return
    }

    try {
      if (editingAssessment) {
        await api.admin.updateAssessment(editingAssessment.id, formData)
        setToast({ message: 'Assessment updated successfully!', type: 'success' })
      } else {
        await api.admin.createAssessment(formData)
        setToast({ message: 'Assessment scheduled successfully!', type: 'success' })
      }
      setShowModal(false)
      setEditingAssessment(null)
      setFormData({ course_id: '', trainer_id: '', manager_ids: [], school_ops_manager_ids: [], scheduled_date: '' })
      loadData()
    } catch (error: any) {
      setToast({ message: error.message || `Failed to ${editingAssessment ? 'update' : 'schedule'} assessment`, type: 'error' })
    }
  }

  const handleEdit = (assessment: any) => {
    setEditingAssessment(assessment)
    setFormData({
      course_id: assessment.course_id || '',
      trainer_id: assessment.trainer_id || '',
      manager_ids: assessment.assigned_managers ? assessment.assigned_managers.map((m: any) => m.id) : [],
      school_ops_manager_ids: assessment.assigned_school_ops_managers ? assessment.assigned_school_ops_managers.map((m: any) => m.id) : [],
      scheduled_date: assessment.scheduled_date ? new Date(assessment.scheduled_date).toISOString().slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const handleCancel = async () => {
    if (!assessmentToCancel) return
    try {
      await api.admin.deleteAssessment(assessmentToCancel.id)
      setToast({ message: 'Assessment cancelled successfully!', type: 'success' })
      setShowCancelConfirm(false)
      setAssessmentToCancel(null)
      loadData()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to cancel assessment', type: 'error' })
    }
  }

  const openCancelConfirm = (assessment: any) => {
    setAssessmentToCancel(assessment)
    setShowCancelConfirm(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAssessment(null)
    // Keep the selected date, only reset other form fields
    setFormData({ 
      course_id: '', 
      trainer_id: '', 
      manager_ids: [], 
      school_ops_manager_ids: [],
      scheduled_date: selectedDate ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16) : ''
    })
  }
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessment Scheduler</h1>
          <p className="text-slate-500 text-sm">Schedule and manage assessment sessions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </button>
      </div>

      {/* Compact Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search - Full width on mobile, flexible on desktop */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filter Dropdowns - Compact */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>

            <select
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
            >
              <option value="all">All Trainers</option>
              {trainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="past">Past</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
            >
              <option value={10}>10/page</option>
              <option value={25}>25/page</option>
              <option value={50}>50/page</option>
              <option value={100}>100/page</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all' || courseFilter !== 'all' || trainerFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCourseFilter('all')
                setTrainerFilter('all')
                setDateFilter('all')
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-medium">{paginatedAssessments.length}</span> of{' '}
              <span className="font-medium">{filteredAndSortedAssessments.length}</span>
              {filteredAndSortedAssessments.length !== assessments.length && (
                <span> (filtered from {assessments.length} total)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar & Slots */}
        <div className="lg:col-span-1 space-y-4">
          <div className="container-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>📅</span> Select Date
            </h3>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                title="Previous month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                title="Next month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-slate-500 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
              {getCalendarDays().map((dayInfo, i) => {
                const isSelected = selectedDate && 
                  dayInfo.date.toDateString() === selectedDate.toDateString()
                const isToday = dayInfo.date.toDateString() === new Date().toDateString()
                const dayAssessments = getAssessmentsForDate(dayInfo.date)
                const hasAssessments = dayAssessments.length > 0
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(dayInfo.date)}
                    className={`p-2 rounded transition-colors relative ${
                      !dayInfo.isCurrentMonth 
                        ? 'text-slate-400' 
                        : 'text-slate-900 dark:text-slate-100'
                    } ${
                      isSelected 
                        ? 'bg-primary text-white' 
                        : isToday
                        ? 'bg-slate-200 dark:bg-slate-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    disabled={!dayInfo.isCurrentMonth}
                    title={hasAssessments ? `${dayAssessments.length} assessment(s)` : ''}
                  >
                    <span>{dayInfo.day}</span>
                    {hasAssessments && (
                      <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected 
                          ? 'bg-white' 
                          : 'bg-primary'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                <p className="text-slate-600 dark:text-slate-300 mb-1">
                  Selected: {selectedDate.toLocaleDateString()}
                </p>
                {(() => {
                  const selectedAssessments = getAssessmentsForDate(selectedDate)
                  if (selectedAssessments.length > 0) {
                    return (
                      <div className="text-xs">
                        <p className="font-medium mb-1">{selectedAssessments.length} assessment(s):</p>
                        {selectedAssessments.map(assessment => (
                          <div key={assessment.id} className="text-slate-500 dark:text-slate-400">
                            • {assessment.course?.name} - {assessment.trainer?.name}
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>

          <div className="container-card p-5">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Assessments</span>
                <span className="font-semibold text-primary">{assessments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Scheduled</span>
                <span className="font-semibold text-orange-600">{assessments.filter(a => a.status === 'Scheduled').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Completed</span>
                <span className="font-semibold text-green-600">{assessments.filter(a => a.status === 'Completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Trainers</span>
                <span className="font-semibold text-blue-600">{trainers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Assessments */}
        <div className="lg:col-span-2 container-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th 
                    className="pb-3 font-medium text-slate-600 cursor-pointer hover:text-primary"
                    onClick={() => {
                      if (sortBy === 'course') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('course')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Course {sortBy === 'course' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="pb-3 font-medium text-slate-600 cursor-pointer hover:text-primary"
                    onClick={() => {
                      if (sortBy === 'trainer') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('trainer')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Trainer {sortBy === 'trainer' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="pb-3 font-medium text-slate-600">Managers</th>
                  <th className="pb-3 font-medium text-slate-600">School Ops Managers</th>
                  <th 
                    className="pb-3 font-medium text-slate-600 cursor-pointer hover:text-primary"
                    onClick={() => {
                      if (sortBy === 'scheduled_date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('scheduled_date')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Date & Time {sortBy === 'scheduled_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="pb-3 font-medium text-slate-600 cursor-pointer hover:text-primary"
                    onClick={() => {
                      if (sortBy === 'status') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('status')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="pb-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paginatedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No assessments found matching your search
                  </td>
                </tr>
              ) : (
                paginatedAssessments.map((assessment) => {
                  return (
                  <tr key={assessment.id} className="border-b border-slate-100">
                  <td className="py-3">📘 {assessment.course?.name || 'N/A'}</td>
                  <td className="py-3">{assessment.trainer?.name || 'N/A'}</td>
                  <td className="py-3">
                    {assessment.assignedManagers && assessment.assignedManagers.length > 0 ? (
                      <div className="space-y-1">
                        {assessment.assignedManagers.slice(0, 2).map((manager: any) => (
                          <div key={manager.id} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-2 py-1">
                            {manager.name}
                          </div>
                        ))}
                        {assessment.assignedManagers.length > 2 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            +{assessment.assignedManagers.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : assessment.manager ? (
                      <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-2 py-1">
                        {assessment.manager.name}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">No managers</span>
                    )}
                  </td>
                  <td className="py-3">
                    {assessment.assignedSchoolOpsManagers && assessment.assignedSchoolOpsManagers.length > 0 ? (
                      <div className="space-y-1">
                        {assessment.assignedSchoolOpsManagers.slice(0, 2).map((manager: any) => (
                          <div key={manager.id} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded px-2 py-1">
                            {manager.name}
                          </div>
                        ))}
                        {assessment.assignedSchoolOpsManagers.length > 2 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            +{assessment.assignedSchoolOpsManagers.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">No school ops managers</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>📅 {new Date(assessment.scheduled_date).toLocaleDateString()}</span>
                      <span>🕐 {new Date(assessment.scheduled_date).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {assessment.status === 'Scheduled' && <span className="badge-yellow">Scheduled</span>}
                    {assessment.status === 'Completed' && <span className="badge-green">Completed</span>}
                  </td>
                  <td className="py-3 space-x-2">
                    <button 
                      onClick={() => openEditModal(assessment)}
                      className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Edit assessment"
                    >
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button 
                      onClick={() => openCancelConfirm(assessment)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Cancel assessment"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
                  )
                })
              )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedAssessments.length)} of {filteredAndSortedAssessments.length} assessments
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum
                            ? 'bg-primary text-white border-primary'
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Assessment Modal - Enhanced Dark Mode */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingAssessment ? 'Edit Assessment' : 'Schedule New Assessment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.level})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Trainer *</label>
            <select
              value={formData.trainer_id}
              onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a trainer</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} - {trainer.department || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Managers (Optional)</label>
            <div ref={dropdownRef} className="relative">
              {/* Multi-select dropdown */}
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-h-[42px] flex items-center justify-between"
              >
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  {selectedManagers.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">Select managers...</span>
                  ) : (
                    <>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {selectedManagers.slice(0, 3).map(manager => (
                          <span key={manager.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                            {manager.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeManager(manager.id)
                              }}
                              className="hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {selectedManagers.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{selectedManagers.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Dropdown content */}
              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg">
                  {/* Search input */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={managerSearch}
                        onChange={(e) => setManagerSearch(e.target.value)}
                        placeholder="Search managers..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Manager list */}
                  <div className="max-h-60 overflow-y-auto p-2">
                    {filteredManagers.length === 0 ? (
                      <div className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">
                        No managers found
                      </div>
                    ) : (
                      filteredManagers.map(manager => (
                        <div
                          key={manager.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleManagerToggle(manager.id)
                          }}
                          className={`p-3 rounded cursor-pointer flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-600 ${
                            formData.manager_ids.includes(manager.id) 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                              : 'border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.manager_ids.includes(manager.id)}
                            onChange={() => handleManagerToggle(manager.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {manager.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {manager.department || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedManagers.length} of {managers.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, manager_ids: [] }))}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select School Ops Managers (Optional)</label>
            <div ref={schoolOpsDropdownRef} className="relative">
              {/* Multi-select dropdown for School Ops Managers */}
              <div 
                onClick={() => setSchoolOpsDropdownOpen(!schoolOpsDropdownOpen)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-h-[42px] flex items-center justify-between"
              >
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  {selectedSchoolOpsManagers.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">Select school ops managers...</span>
                  ) : (
                    <>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedSchoolOpsManagers.length} school ops manager{selectedSchoolOpsManagers.length > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {selectedSchoolOpsManagers.slice(0, 3).map(manager => (
                          <span key={manager.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                            {manager.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => ({
                                  ...prev,
                                  school_ops_manager_ids: prev.school_ops_manager_ids.filter(id => id !== manager.id)
                                }))
                              }}
                              className="hover:text-green-800 dark:hover:text-green-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {selectedSchoolOpsManagers.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{selectedSchoolOpsManagers.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${schoolOpsDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Dropdown content for School Ops Managers */}
              {schoolOpsDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg">
                  {/* Search input */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={schoolOpsManagerSearch}
                        onChange={(e) => setSchoolOpsManagerSearch(e.target.value)}
                        placeholder="Search school ops managers..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* School Ops Manager list */}
                  <div className="max-h-60 overflow-y-auto p-2">
                    {filteredSchoolOpsManagers.length === 0 ? (
                      <div className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">
                        No school ops managers found
                      </div>
                    ) : (
                      filteredSchoolOpsManagers.map(manager => (
                        <div
                          key={manager.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSchoolOpsManagerToggle(manager.id)
                          }}
                          className={`p-3 rounded cursor-pointer flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-600 ${
                            formData.school_ops_manager_ids.includes(manager.id) 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.school_ops_manager_ids.includes(manager.id)}
                            onChange={() => handleSchoolOpsManagerToggle(manager.id)}
                            className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {manager.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {manager.department || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedSchoolOpsManagers.length} of {schoolOpsManagers.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, school_ops_manager_ids: [] }))}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            {editingAssessment ? 'Update Assessment' : 'Schedule Assessment'}
          </button>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal 
        isOpen={showCancelConfirm} 
        onClose={() => {
          setShowCancelConfirm(false)
          setAssessmentToCancel(null)
        }} 
        title="Confirm Cancellation"
      >
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to cancel this assessment?
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-sm">
            <p><strong>Course:</strong> {assessmentToCancel?.course?.name}</p>
            <p><strong>Trainer:</strong> {assessmentToCancel?.trainer?.name}</p>
            <p><strong>Date:</strong> {assessmentToCancel?.scheduled_date && new Date(assessmentToCancel.scheduled_date).toLocaleString()}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCancelConfirm(false)
                setAssessmentToCancel(null)
              }}
              className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              No, Keep It
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Yes, Cancel Assessment
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
