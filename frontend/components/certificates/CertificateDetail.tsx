'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Certificate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CertificateDetailProps {
  id: number;
  isAdmin?: boolean;
}

export function CertificateDetail({ id, isAdmin = false }: CertificateDetailProps) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const data = await certificateApi.getCertificate(id);
        setCertificate(data);
      } catch (error) {
        console.error('Error fetching certificate:', error);
        toast.error('Failed to load certificate');
        router.push('/certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id, router]);

  const handleDownload = async () => {
    if (!certificate) return;
    
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

  const handleRevoke = async () => {
    if (!certificate) return;
    
    try {
      setRevoking(true);
      await certificateApi.revokeCertificate(certificate.id, revokeReason);
      setCertificate(prev => prev ? { ...prev, status: 'revoked' } : null);
      toast.success('Certificate revoked successfully');
      setShowRevokeDialog(false);
      setRevokeReason('');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    } finally {
      setRevoking(false);
    }
  };

  if (loading || !certificate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isRevoked = certificate.status === 'revoked';
  const isExpired = certificate.status === 'expired';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {certificate.course?.name || 'Certificate Details'}
        </h1>
        <div className="ml-auto flex space-x-2">
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {isAdmin && !isRevoked && !isExpired && (
            <>
              <Button
                variant="destructive"
                onClick={() => setShowRevokeDialog(true)}
                disabled={revoking}
              >
                {revoking ? 'Revoking...' : 'Revoke'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {certificate.course?.name || 'Certificate of Completion'}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Issued to {certificate.user?.name || 'Unknown User'}
                  </p>
                </div>
                <Badge variant={isRevoked ? 'destructive' : isExpired ? 'warning' : 'default'}>
                  {certificate.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="font-medium">{certificate.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-medium">
                      {format(new Date(certificate.issueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {certificate.expiryDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {format(new Date(certificate.expiryDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {certificate.course?.code && (
                    <div>
                      <p className="text-sm text-muted-foreground">Course Code</p>
                      <p className="font-medium">{certificate.course.code}</p>
                    </div>
                  )}
                </div>

                {certificate.template && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Template</p>
                    <div className="flex items-center space-x-3 p-3 border rounded-md">
                      {certificate.template.thumbnail && (
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                          <img
                            src={`/api/file?path=${encodeURIComponent(certificate.template.thumbnail)}`}
                            alt={certificate.template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{certificate.template.name}</p>
                        {certificate.template.isDefault && (
                          <Badge variant="outline" className="mt-1">Default</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isRevoked && certificate.metadata?.revokedAt && (
                  <div className="p-4 bg-destructive/10 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-destructive">This certificate has been revoked</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {certificate.metadata.revokeReason && (
                            <span>Reason: {certificate.metadata.revokeReason}<br /></span>
                          )}
                          Revoked on {format(new Date(certificate.metadata.revokedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {certificate.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{certificate.user?.name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">{certificate.user?.email || 'No email'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {certificate.course && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{certificate.course.name}</p>
                  {certificate.course.code && (
                    <p className="text-sm text-muted-foreground">
                      Code: {certificate.course.code}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this certificate? This action cannot be undone.
              <div className="mt-4 space-y-2">
                <label htmlFor="revokeReason" className="block text-sm font-medium">
                  Reason (optional)
                </label>
                <textarea
                  id="revokeReason"
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter reason for revocation"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive hover:bg-destructive/90"
              disabled={revoking}
            >
              {revoking ? 'Revoking...' : 'Revoke Certificate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
