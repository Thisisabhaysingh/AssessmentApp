'use client';

import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Users, BookOpen, ClipboardList, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import Toast from '@/components/Toast';

interface TrashItem {
  id: number;
  type: 'user' | 'course' | 'assessment';
  name: string;
  email?: string;
  role?: string;
  code?: string;
  level?: string;
  trainer?: string;
  status?: string;
  deletedAt: string;
  createdAt: string;
  details: string;
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | 'empty'>('restore');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const fetchTrashItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trash');
      if (response.success) {
        setItems(response.data.items || []);
      } else {
        setError(response.message || 'Failed to fetch trash items');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trash items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      setProcessing(true);
      const response = await api.post(`/trash/restore/${item.type}/${item.id}`, {});
      if (response.success) {
        setItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
        setToast({ message: `${item.type} restored successfully`, type: 'success' });
      } else {
        setToast({ message: response.message || 'Failed to restore item', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to restore item', type: 'error' });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      setSelectedItem(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    try {
      setProcessing(true);
      const response = await api.delete(`/trash/${item.type}/${item.id}`);
      if (response.success) {
        setItems(prev => prev.filter(i => i.id !== item.id || i.type !== item.type));
        setToast({ message: `${item.type} permanently deleted`, type: 'success' });
      } else {
        setToast({ message: response.message || 'Failed to delete item', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete item', type: 'error' });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      setSelectedItem(null);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      setProcessing(true);
      const response = await api.delete('/trash/empty');
      if (response.success) {
        setItems([]);
        setToast({ message: `Trash emptied successfully. ${response.data.deleted.total} items deleted.`, type: 'success' });
      } else {
        setToast({ message: response.message || 'Failed to empty trash', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to empty trash', type: 'error' });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const openConfirmModal = (action: 'restore' | 'delete' | 'empty', item?: TrashItem) => {
    setConfirmAction(action);
    setSelectedItem(item || null);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'restore' && selectedItem) {
      handleRestore(selectedItem);
    } else if (confirmAction === 'delete' && selectedItem) {
      handlePermanentDelete(selectedItem);
    } else if (confirmAction === 'empty') {
      handleEmptyTrash();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'course':
        return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'assessment':
        return <ClipboardList className="w-5 h-5 text-purple-500" />;
      default:
        return <Trash2 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user':
        return 'User';
      case 'course':
        return 'Course';
      case 'assessment':
        return 'Assessment';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading trash items...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 dark:bg-slate-900 dark:text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-red-500 dark:text-red-400" />
            Trash
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Restore deleted items or permanently remove them</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => openConfirmModal('empty')}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Users</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{items.filter(i => i.type === 'user').length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Courses</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{items.filter(i => i.type === 'course').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Assessments</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{items.filter(i => i.type === 'assessment').length}</p>
          </div>
        </div>
      )}

      {/* Trash Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Trash2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Trash is Empty</h3>
          <p className="text-gray-500 dark:text-gray-400">Deleted items will appear here. You can restore them or permanently delete them.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deleted At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {items.map((item, index) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{getTypeLabel(item.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    {item.email && <p className="text-sm text-gray-500 dark:text-gray-400">{item.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.details}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.deletedAt)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openConfirmModal('restore', item)}
                        disabled={processing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 text-sm"
                        title="Restore"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                      <button
                        onClick={() => openConfirmModal('delete', item)}
                        disabled={processing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 text-sm"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmAction === 'restore' ? (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {confirmAction === 'restore' && 'Restore Item'}
                {confirmAction === 'delete' && 'Delete Permanently'}
                {confirmAction === 'empty' && 'Empty Trash'}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {confirmAction === 'restore' && (
                <>Are you sure you want to restore <strong>{selectedItem?.name}</strong>? It will be restored to its original location.</>
              )}
              {confirmAction === 'delete' && (
                <>Are you sure you want to permanently delete <strong>{selectedItem?.name}</strong>? This action cannot be undone.</>
              )}
              {confirmAction === 'empty' && (
                <>Are you sure you want to empty the trash? All <strong>{items.length}</strong> items will be permanently deleted. This action cannot be undone.</>
              )}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedItem(null);
                }}
                disabled={processing}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  confirmAction === 'restore'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  confirmAction === 'restore' ? 'Restore' : 'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
