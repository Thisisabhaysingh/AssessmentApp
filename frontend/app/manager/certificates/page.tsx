'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Certificate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Search, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';
import userApi from '@/lib/api/users';

export default function ManagerCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchCertificates(parseInt(selectedUser));
    } else {
      fetchCertificates();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getUsers({ role: 'trainer' });
      setUsers(data.map(user => ({ id: user.id, name: user.name })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchCertificates = async (userId?: number) => {
    try {
      setLoading(true);
      const params: any = {};
      if (userId) params.userId = userId;
      if (searchQuery) params.search = searchQuery;
      
      const data = await certificateApi.getCertificates(params);
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates(selectedUser ? parseInt(selectedUser) : undefined);
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      const blob = await certificateApi.downloadCertificate(certificate.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Certificate Management</h1>
        <Button onClick={() => router.push('/manager/certificates/issue')}>
          <Plus className="w-4 h-4 mr-2" />
          Issue Certificate
        </Button>
      </div>

      <Card className='dark:bg-slate-800'>
        <CardHeader>
          <CardTitle>Search Certificates</CardTitle>
          <CardDescription>Filter certificates by user or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="search">Search</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search"
                    placeholder="Search by certificate number or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

      {certificates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No certificates found</h3>
          <p className="text-muted-foreground mt-2">
            {selectedUser || searchQuery 
              ? 'No certificates match your search criteria' 
              : 'No certificates have been issued yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {selectedUser 
                ? `Certificates for ${users.find(u => u.id.toString() === selectedUser)?.name || 'selected user'}`
                : 'All Certificates'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'} found
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {certificate.course?.name || 'Certificate of Completion'}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {certificate.user?.name || 'Unknown User'}
                      </CardDescription>
                    </div>
                    <Badge variant={certificate.status === 'active' ? 'default' : 'destructive'}>
                      {certificate.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    {certificate.template?.thumbnail ? (
                      <img
                        src={`/api/file?path=${encodeURIComponent(certificate.template.thumbnail)}`}
                        alt={certificate.template.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-4 pt-0">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      #{certificate.certificateNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(certificate.issueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(certificate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
