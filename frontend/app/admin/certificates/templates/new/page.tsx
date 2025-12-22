'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import { ArrowLeft, Upload, FileText, Image } from 'lucide-react';
import certificateApi from '@/lib/api/certificates';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  fields: z.string().optional(),
});

type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

export default function NewTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      fields: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'template') {
        setTemplateFile(file);
      } else {
        setThumbnailFile(file);
      }
    }
  };

  const onSubmit = async (data: CreateTemplateFormValues) => {
    if (!templateFile) {
      toast.error('Please select a template file');
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('isDefault', data.isDefault.toString());
      formData.append('fields', data.fields || '');

      // Append files
      formData.append('templateFile', templateFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      await certificateApi.createTemplate(formData);

      toast.success('Template created successfully');
      router.push('/admin/certificates/templates');
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.message || 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/certificates/templates')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Certificate Template</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a new certificate template that can be used to generate certificates
          </p>
        </div>
      </div>

      <Card className='dark:bg-slate-800 bg-slate-50'>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            Configure your certificate template settings and upload the required files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
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
                        placeholder="Enter template description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Set as Default Template
                      </FormLabel>
                      <FormDescription>
                        This template will be used automatically when generating certificates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateFile">Template File *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="templateFile"
                      type="file"
                      accept=".txt,.html,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, 'template')}
                      className="flex-1"
                    />
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload your certificate template file (PDF, HTML, or text format)
                  </p>
                  {templateFile && (
                    <p className="text-sm text-green-600">
                      Selected: {templateFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailFile">Thumbnail (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="thumbnailFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'thumbnail')}
                      className="flex-1"
                    />
                    <Image className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a thumbnail image for this template (optional)
                  </p>
                  {thumbnailFile && (
                    <p className="text-sm text-green-600">
                      Selected: {thumbnailFile.name}
                    </p>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="fields"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Fields (JSON format - Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"recipientName": true, "courseName": true, "issueDate": true}'
                        className="min-h-[100px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Define custom fields that can be used in the template (JSON format)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/certificates/templates')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !templateFile}>
                  {isLoading ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
