'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminImportCertificatesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/certificates')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Certificates
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bulk import certificates from external sources or upload multiple certificates at once
          </p>
        </div>
      </div>

      <Card className="text-center py-16 dark:bg-slate-800 bg-slate-50">
        <CardContent>
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Upload className="w-12 h-12 text-muted-foreground" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Bulk Import Coming Soon</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            This feature will allow you to upload multiple certificates at once or import from external systems.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button disabled>
              Upload CSV/Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
