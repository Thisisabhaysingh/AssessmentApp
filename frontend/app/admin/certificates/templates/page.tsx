// c:/Users/OMOLP157/Documents/Automation_Assessment/frontend/app/admin/certificates/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CertificateTemplate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import certificateApi from '@/lib/api/certificates';
import {TemplateList} from '@/components/certificates/TemplateList';

export default function AdminCertificateTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificateApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    // Create a sample template file
    const sampleContent = `CERTIFICATE OF COMPLETION

This is to certify that

[RECIPIENT_NAME]

has successfully completed the course

[COURSE_NAME]

Certificate Number: [CERTIFICATE_NUMBER]
Issue Date: [ISSUE_DATE]
Expiry Date: [EXPIRY_DATE]

[ORGANIZATION_NAME]
Quality Assurance Department

---
Note: Replace the placeholders in brackets [PLACEHOLDER] with actual values when generating certificates.
Available placeholders:
- [RECIPIENT_NAME] - The full name of the person receiving the certificate
- [COURSE_NAME] - The name of the completed course
- [CERTIFICATE_NUMBER] - The unique certificate number
- [ISSUE_DATE] - The date when the certificate was issued
- [EXPIRY_DATE] - The expiry date (if applicable)
- [ORGANIZATION_NAME] - Your organization name`;

    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-certificate-template.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Sample template downloaded');
  };

  const handleTemplateSelect = (template: CertificateTemplate) => {
    router.push(`/admin/certificates/templates/${template.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Certificate Templates</h1>
          <p className="text-muted-foreground">
            Manage certificate templates for your organization
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadSample}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
          <Button
            onClick={() => router.push('/admin/certificates/templates/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <Card className='dark:bg-slate-800 bg-slate-50'>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Create and manage certificate templates that can be used to issue certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateList
            onSelect={handleTemplateSelect}
            showActions={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}