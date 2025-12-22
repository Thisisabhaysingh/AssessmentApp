'use client'
import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { Users, UserCheck, UserPlus, Filter, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'trainer',
    department: '',
    designation: ''
  })
  
  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const result: any = await api.admin.getUsers()
      setUsers(result.data.users)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = { ...formData }
        if (!updateData.password) {
          delete updateData.password // Don't update password if not provided
        }
        await api.admin.updateUser(editingUser.id, updateData)
        setToast({ message: 'User updated successfully!', type: 'success' })
      } else {
        // Create new user
        await api.admin.createUser(formData)
        setToast({ message: 'User created successfully!', type: 'success' })
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'trainer', department: '', designation: '' })
      loadUsers()
    } catch (error: any) {
      setToast({ message: error.message || `Failed to ${editingUser ? 'update' : 'create'} user`, type: 'error' })
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      role: user.role || 'trainer',
      department: user.department || '',
      designation: user.designation || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      await api.admin.deleteUser(userToDelete.id)
      setToast({ message: 'User deleted successfully!', type: 'success' })
      setShowDeleteConfirm(false)
      setUserToDelete(null)
      loadUsers()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete user', type: 'error' })
    }
  }

  const openDeleteConfirm = (user: any) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'trainer', department: '', designation: '' })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-slate-500 text-sm">Manage system users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="trainer">Trainer</option>
          </select>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-sm hover:bg-red-600"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={Users} color="text-blue-600" />
        <StatCard title="Active Users" value={users.filter(u => u.role !== 'inactive').length} icon={UserCheck} color="text-green-600" />
        <StatCard title="Trainers" value={users.filter(u => u.role === 'trainer').length} icon={UserPlus} color="text-blue-600" />
        <StatCard title="Managers" value={users.filter(u => u.role === 'manager').length} icon={UserPlus} color="text-purple-600" />
      </div>

      {/* Users Table */}
      <div className="container-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Users</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-medium text-slate-600">Name</th>
                <th className="pb-3 font-medium text-slate-600">Email</th>
                <th className="pb-3 font-medium text-slate-600">Role</th>
                <th className="pb-3 font-medium text-slate-600">Status</th>
                <th className="pb-3 font-medium text-slate-600">Last Login</th>
                <th className="pb-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users found matching your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3">{user.name}</td>
                  <td className="py-3 text-slate-600">{user.email}</td>
                  <td className="py-3">
                    {user.role === 'trainer' && <span className="badge bg-blue-100 text-blue-700">trainer</span>}
                    {user.role === 'manager' && <span className="badge bg-purple-100 text-purple-700">manager</span>}
                    {user.role === 'admin' && <span className="badge-red">admin</span>}
                  </td>
                  <td className="py-3">
                    {user.status === 'active' ? (
                      <span className="badge-green bg-slate-700">active</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">inactive</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{user.lastLogin}</td>
                  <td className="py-3 space-x-2">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button 
                      onClick={() => openDeleteConfirm(user)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal - Enhanced Dark Mode */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit} className="space-y-4 dark:bg-slate-700 dark:text-slate-200">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter email address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Password {editingUser && <span className="text-xs text-slate-500">(leave blank to keep current)</span>}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password (min 6 characters)'}
              required={!editingUser}
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="trainer">Trainer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter department"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter designation"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            {editingUser ? 'Update User' : 'Create User'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false)
          setUserToDelete(null)
        }} 
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setUserToDelete(null)
              }}
              className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
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
