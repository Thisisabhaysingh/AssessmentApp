// c:/Users/OMOLP157/Documents/Automation_Assessment/frontend/app/admin/certificates/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CertificateTemplate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Download } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
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
      console.log('📄 Fetching templates...');
      const data = await certificateApi.getTemplates();
      console.log('📄 Templates fetched:', data);
      const defaultTemplate = data.find(t => t.isDefault);
      console.log('🎯 Current default template:', defaultTemplate);
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  // Make fetchTemplates available to child components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fetchTemplates = fetchTemplates;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).fetchTemplates;
      }
    };
  }, [fetchTemplates]);

  const handleDownloadSample = async () => {
    try {
      // Find the default template
      const defaultTemplate = templates.find(t => t.isDefault);
      
      if (!defaultTemplate) {
        toast.error('No default template found');
        return;
      }

      // Download the actual default template file
      // Convert backslashes to forward slashes and remove the uploads prefix
      const cleanPath = defaultTemplate.templateFile.replace(/\\/g, '/').replace('uploads/', '');
      const templateUrl = `http://localhost:4000/uploads/${cleanPath}`;
      
      // Create download link
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use the original filename
      const originalFileName = defaultTemplate.templateFile.split('\\').pop() || 'default-template.docx';
      a.download = originalFileName;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Default template downloaded');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/certificates')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Certificates
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Certificate Templates</h1>
            <p className="text-muted-foreground">
              Manage certificate templates for your organization
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔄 Refresh button clicked!');
              fetchTemplates();
            }}
          >
            🔄 Refresh
          </Button>
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