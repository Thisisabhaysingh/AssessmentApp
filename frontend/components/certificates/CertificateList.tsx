'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Certificate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Plus, Upload, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';

interface CertificateListProps {
  isAdmin?: boolean;
  userId?: number;
}

export function CertificateList({ isAdmin = false, userId }: CertificateListProps) {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (userId) params.userId = userId;
      const data = await certificateApi.getCertificates(params);
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const handleDownload = async (certificate: Certificate) => {
    try {
      await certificateApi.downloadCertificate(certificate.id);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    try {
      setUploading(true);
      await certificateApi.uploadExternalCertificate(file, userId);
      toast.success('Certificate uploaded successfully');
      setFile(null);
      fetchCertificates();
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Certificates</h2>
        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={() => router.push('/admin/certificates/issue')}>
              <Plus className="w-4 h-4 mr-2" />
              Issue Certificate
            </Button>
          )}
          <Button variant="outline" onClick={() => document.getElementById('certificate-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Certificate
            <input
              id="certificate-upload"
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </Button>
        </div>
      </div>

      {file && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setFile(null)} disabled={uploading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No certificates found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isAdmin ? 'Issue a new certificate or upload an existing one' : 'You don\'t have any certificates yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      {certificate.course?.name || 'External Certificate'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Issued on {format(new Date(certificate.issueDate), 'MMM d, yyyy')}
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
                    <div className="text-muted-foreground text-sm">No preview available</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                <span className="text-sm text-muted-foreground">
                  #{certificate.certificateNumber}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/certificates/${certificate.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(certificate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
