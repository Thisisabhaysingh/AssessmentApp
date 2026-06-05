'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CertificateTemplate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Star, FileImage, Eye } from 'lucide-react';
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

interface TemplateListProps {
  onSelect?: (template: CertificateTemplate) => void;
  showActions?: boolean;
}

export function TemplateList({ onSelect, showActions = true }: TemplateListProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CertificateTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificateApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      setDeletingId(templateToDelete.id);
      await certificateApi.deleteTemplate(templateToDelete.id);
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
      setTemplateToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      console.log('🎯 Setting default template to ID:', id);
      await certificateApi.setDefaultTemplate(id);
      console.log('✅ API call successful, updating local state');
      setTemplates(prev => 
        prev.map(template => ({
          ...template,
          isDefault: template.id === id
        }))
      );
      console.log('🔄 Local state updated, triggering parent refresh');
      toast.success('Default template updated');
      
      // Trigger parent refresh by calling window.parent.fetchTemplates if available
      if (typeof window !== 'undefined' && (window as any).fetchTemplates) {
        (window as any).fetchTemplates();
      }
    } catch (error) {
      console.error('❌ Error setting default template:', error);
      toast.error('Failed to set default template');
    }
  };

  const handlePreview = async (template: CertificateTemplate) => {
    try {
      // Create a new window to preview the template
      // Use full backend URL with port 4000
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';
      const previewUrl = `${apiBase}/certificates/template-preview/${template.id}`;
      window.open(previewUrl, '_blank', 'width=800,height=600');
    } catch (error) {
      console.error('Error previewing template:', error);
      toast.error('Failed to preview template');
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
    <div className="space-y-6">
      {showActions && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Certificate Templates</h2>
          <Button onClick={() => router.push('/admin/certificates/templates/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No templates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new template
          </p>
          {showActions && (
            <div className="mt-6">
              <Button onClick={() => router.push('/admin/certificates/templates/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                {template.thumbnail ? (
                  <img
                    src={`/api/file?path=${encodeURIComponent(template.thumbnail)}`}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FileImage className="h-12 w-12" />
                  </div>
                )}
                {template.isDefault && (
                  <div className="absolute top-2 right-2">
                    <Badge className="flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Default
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">
                  {template.name}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {template.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>
                    {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {template.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
              {(showActions || onSelect) && (
                <CardFooter className="flex justify-between p-4 pt-0">
                  {onSelect ? (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant={template.isDefault ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !template.isDefault && handleSetDefault(template.id)}
                        disabled={template.isDefault}
                      >
                        {template.isDefault ? 'Default' : 'Set Default'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/certificates/templates/${template.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant={template.isDefault ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !template.isDefault && handleSetDefault(template.id)}
                        disabled={template.isDefault || deletingId === template.id}
                      >
                        {template.isDefault ? 'Default' : 'Set Default'}
                      </Button>
                    </div>
                  )}
                  
                  {showActions && !template.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setShowDeleteDialog(true);
                      }}
                      disabled={deletingId === template.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletingId !== null}
            >
              {deletingId === templateToDelete?.id ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
