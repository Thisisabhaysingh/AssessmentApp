'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CertificateTemplate, CertificateTemplateFormData } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, X, FileImage, FileText } from 'lucide-react';
import certificateApi from '@/lib/api/certificates';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  fields: z.any().optional(),
  templateFile: z.any().optional(),
  thumbnail: z.any().optional()
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  template?: CertificateTemplate;
  onSuccess?: () => void;
}

export function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    template?.thumbnail ? `/api/file?path=${encodeURIComponent(template.thumbnail)}` : null
  );
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const defaultValues: Partial<TemplateFormValues> = {
    name: template?.name || '',
    description: template?.description || '',
    isDefault: template?.isDefault || false,
    status: template?.status || 'active',
    fields: template?.fields || {}
  };

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description,
        isDefault: template.isDefault,
        status: template.status,
        fields: template.fields || {}
      });
    }
  }, [template, form]);

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setPreviewUrl(null);
    form.setValue('thumbnail', undefined);
  };

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'fields' && value) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });n
      // Append files if they exist
      if (templateFile) {
        formData.append('templateFile', templateFile);
      }
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (template) {
        // Update existing template
        await certificateApi.updateTemplate(template.id, formData);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        await certificateApi.createTemplate(formData);
        toast.success('Template created successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/certificates/templates');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  {template ? 'Update the template details' : 'Create a new certificate template'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Professional Certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of this template"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <FormLabel>Template File</FormLabel>
                    <div className="mt-1 flex items-center">
                      <label
                        htmlFor="template-file"
                        className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-dashed rounded-md shadow-sm text-sm font-medium text-muted-foreground hover:bg-muted"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        {templateFile ? templateFile.name : template?.templateFile ? 'Change template file' : 'Upload template file (PDF or Image)'}
                        <input
                          id="template-file"
                          name="template-file"
                          type="file"
                          className="sr-only"
                          onChange={handleTemplateFileChange}
                          accept=".pdf,image/*"
                        />
                      </label>
                    </div>
                    {!templateFile && template?.templateFile && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current file: {template.templateFile.split('/').pop()}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormLabel>Thumbnail (Optional)</FormLabel>
                    <div className="mt-1">
                      {previewUrl ? (
                        <div className="relative group">
                          <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeThumbnail}
                              className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="thumbnail-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </div>
                          <input
                            id="thumbnail-upload"
                            name="thumbnail-upload"
                            type="file"
                            className="hidden"
                            onChange={handleThumbnailChange}
                            accept="image/*"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure template options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Set as default template</FormLabel>
                        <FormDescription>
                          This template will be used as the default for new certificates
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={template?.isDefault}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Template Status</FormLabel>
                        <FormDescription>
                          Inactive templates won't be available for selection
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {field.value === 'active' ? 'Active' : 'Inactive'}
                          </span>
                          <Switch
                            checked={field.value === 'active'}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? 'active' : 'inactive')
                            }
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your template will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-muted rounded-md border flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Template preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <FileImage className="mx-auto h-12 w-12 mb-2" />
                      <p className="text-sm">Upload a template to see a preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {template ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
