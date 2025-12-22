'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Certificate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';
import { api } from '@/lib/api';

export default function TrainerCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificateApi.getMyCertificates();
      console.log('📋 Fetched certificates:', data);
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
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

  // const handleUpload = async () => {
  //   if (!file) return;

  //   try {
  //     setUploading(true);
  //     console.log(`🚀 Starting certificate upload process...`);
  //     console.log(`📁 File selected:`, {
  //       name: file.name,
  //       size: file.size,
  //       type: file.type
  //     });

  //     // Use the API wrapper to get current user
  //     console.log(`🔍 Getting current user information...`);
  //     const userData: any = await api.me();
  //     console.log(`👤 User data received:`, userData);

  //     if (!userData?.data?.id) {
  //       throw new Error('User not authenticated');
  //     }

  //     console.log(`📤 Starting certificate upload for user ${userData.data.id}...`);

  //     const uploadFormData = new FormData();
  //     uploadFormData.append('certificate', file);
  //     // userId is automatically set by the trainer upload endpoint

  //     const API_BASE = 'http://localhost:4000/api';
  //     const finalUploadResponse = await fetch(`${API_BASE}/certificates/trainer/upload`, {
  //       method: 'POST',
  //       credentials: 'include',
  //       body: uploadFormData,
  //     });

  //     console.log(`📡 Upload response status: ${finalUploadResponse.status}`);
  //     const finalUploadResponseText = await finalUploadResponse.text();
  //     console.log(`📡 Upload response:`, finalUploadResponseText);

  //     if (!finalUploadResponse.ok) {
  //       throw new Error(`Upload failed: ${finalUploadResponse.status}`);
  //     }

  //     const uploadResult = JSON.parse(finalUploadResponseText);
  //     console.log(`✅ Upload successful:`, uploadResult);
  //     console.log(`✅ Certificate uploaded successfully`);
  //     toast.success('Certificate uploaded successfully');
  //     setFile(null);
  //     fetchCertificates();
  //   } catch (error) {
  //     console.error('❌ Error uploading certificate:', error);
  //     toast.error('Failed to upload certificate');
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleUpload = async () => {
  if (!file) return;

  try {
    setUploading(true);
    console.log('🚀 Starting certificate upload process...');
    console.log('📁 File selected:', file);

    // Directly call trainer upload
    const uploadedCertificate = await certificateApi.uploadMyCertificate(file);

    console.log('✅ Certificate uploaded successfully', uploadedCertificate);
    toast.success('Certificate uploaded successfully');
    setFile(null);
    fetchCertificates(); // refresh list
  } catch (error) {
    console.error('❌ Error uploading certificate:', error);
    toast.error('Failed to upload certificate');
  } finally {
    setUploading(false);
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage your certificates</p>
        </div>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={() => document.getElementById('certificate-upload')?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Certificate
          <input
            id="certificate-upload"
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </Button>
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
        <Card className="border-dashed dark:bg-slate-700 ">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No certificates found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {file ? 'Upload your certificate to get started' : 'You don\'t have any certificates yet'}
            </p>
            {!file && (
              <Button 
                variant="outline"
                onClick={() => document.getElementById('certificate-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-slate-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold line-clamp-2 mb-1">
                      {certificate.course?.name || 'Certificate of Completion'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(new Date(certificate.issueDate), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={certificate.status === 'active' ? 'default' : 'destructive'}
                    className="shrink-0"
                  >
                    {certificate.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center overflow-hidden border">
                  {certificate.template?.thumbnail ? (
                    <img
                      src={`/api/file?path=${encodeURIComponent(certificate.template.thumbnail)}`}
                      alt={certificate.template.name}
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="h-16 w-16 text-muted-foreground/50" />
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span className="font-mono">#{certificate.certificateNumber}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(certificate)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
