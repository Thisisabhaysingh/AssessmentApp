// c:/Users/OMOLP157/Documents/Automation_Assessment/frontend/app/admin/certificates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Certificate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Search, User, FileText, Filter, Trash2, FileUp, Eye, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';
import userApi from '@/lib/api/users';
import Modal from '@/components/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<{id: number, number: string} | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCertificates();
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [selectedUser, statusFilter]);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getUsers();
      setUsers(data.map(user => ({ id: user.id, name: user.name })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedUser) params.userId = selectedUser;
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const data = await certificateApi.getCertificates(params);
      setCertificates(data);
      setSelectedCertificates([]);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates();
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      await certificateApi.downloadCertificate(certificate.id);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleRevoke = async (certificateId: number, certificateNumber: string) => {
    const reason = prompt(`Enter reason for revoking certificate ${certificateNumber}:`);
    if (!reason || reason.trim() === '') {
      toast.error('Revoke reason is required');
      return;
    }

    try {
      await certificateApi.revokeCertificate(certificateId, reason.trim());
      toast.success('Certificate revoked successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    }
  };

  const handleSingleDelete = async (certificateId: number, certificateNumber: string) => {
    setCertificateToDelete({ id: certificateId, number: certificateNumber });
    setIsBulkDelete(false);
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = async () => {
    if (selectedCertificates.length === 0) return;
    setIsBulkDelete(true);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (isBulkDelete && selectedCertificates.length > 0) {
        await certificateApi.bulkDeleteCertificates(selectedCertificates);
        toast.success(`Successfully deleted ${selectedCertificates.length} certificate(s)`);
        setSelectedCertificates([]);
      } else if (certificateToDelete) {
        await certificateApi.deleteCertificate(certificateToDelete.id);
        toast.success('Certificate deleted successfully');
      }
      fetchCertificates();
      setShowDeleteConfirm(false);
      setCertificateToDelete(null);
    } catch (error) {
      toast.error('Failed to delete certificate(s)');
      console.error('Delete error:', error);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCertificates.length === 0) return;

    try {
      // Download all selected certificates one by one
      for (const certId of selectedCertificates) {
        const cert = certificates.find(c => c.id === certId);
        if (cert) {
          await certificateApi.downloadCertificate(cert.id);
        }
      }
      toast.success(`Downloaded ${selectedCertificates.length} certificate(s)`);
      setSelectedCertificates([]);
    } catch (error) {
      console.error('Error in bulk download:', error);
      toast.error('Failed to process bulk download');
    }
  };

  const toggleCertificateSelection = (certificateId: number) => {
    setSelectedCertificates(prev => 
      prev.includes(certificateId)
        ? prev.filter((id: number) => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCertificates.length === certificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(certificates.map((c: Certificate) => c.id));
    }
  };

  if (loading && !searchQuery && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificate Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and issue certificates for users
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/certificates/templates')}
            className="w-full sm:w-auto"
          >
            <FileText className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button
            onClick={() => router.push('/admin/certificates/issue')}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Issue Certificate
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/certificates/import')}
            className="w-full sm:w-auto"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      <Card className="mb-6 dark:bg-slate-800">
        <CardHeader>
          <CardTitle>Filter Certificates</CardTitle>
          <CardDescription>Find specific certificates using the filters below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}

                >
                  <SelectTrigger id="user" className='dark:bg-slate-800 bg-slate-50'>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent className='dark:bg-slate-800 bg-slate-50'>
                    <SelectItem value="">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status" className='dark:bg-slate-800 bg-slate-50'>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className='dark:bg-slate-800 bg-slate-50'>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search"
                    placeholder="Search by certificate number, user, or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className='dark:bg-slate-800'>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>
              {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'} found
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {selectedCertificates.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                  disabled={selectedCertificates.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ({selectedCertificates.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedCertificates.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedCertificates.length})
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No certificates found</h3>
              <p className="text-muted-foreground mt-2">
                {selectedUser || searchQuery || statusFilter !== 'all'
                  ? 'No certificates match your search criteria' 
                  : 'No certificates have been issued yet'}
              </p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/admin/certificates/issue')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Issue New Certificate
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          certificates.length > 0 && 
                          selectedCertificates.length === certificates.length
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCertificates.includes(certificate.id)}
                          onCheckedChange={() => toggleCertificateSelection(certificate.id)}
                          aria-label={`Select certificate ${certificate.certificateNumber}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">#{certificate.certificateNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {certificate.template?.name || 'No Template'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{certificate.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {certificate.user?.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {certificate.course?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            certificate.status === 'active' 
                              ? 'default' 
                              : certificate.status === 'revoked' 
                                ? 'destructive' 
                                : 'outline'
                          }
                        >
                          {certificate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(certificate.issueDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(certificate)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/certificates/${certificate.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {certificate.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevoke(certificate.id, certificate.certificateNumber)}
                              title="Revoke"
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSingleDelete(certificate.id, certificate.certificateNumber)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false);
          setCertificateToDelete(null);
          setIsBulkDelete(false);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {isBulkDelete 
              ? `Are you sure you want to delete ${selectedCertificates.length} selected certificate(s)? This action cannot be undone.`
              : `Are you sure you want to delete certificate ${certificateToDelete?.number}? This action cannot be undone.`
            }
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setCertificateToDelete(null);
                setIsBulkDelete(false);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}