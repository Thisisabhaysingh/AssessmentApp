'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User, Course } from '@/types/index';
import type { CertificateTemplate } from '@/types/certificate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2, User as UserIcon, BookOpen, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import certificateApi from '@/lib/api/certificates';
import userApi from '@/lib/api/users';
import courseApi from '@/lib/api/courses';

const issueCertificateSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  courseId: z.string().optional(),
  templateId: z.string().min(1, 'Template is required'),
  issueDate: z.date().default(new Date()),
  expiryDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

type IssueCertificateFormValues = z.infer<typeof issueCertificateSchema>;

interface IssueCertificateFormProps {
  onSuccess?: () => void;
  initialData?: {
    userId?: number;
    courseId?: number;
  };
}

export function IssueCertificateForm({ onSuccess, initialData }: IssueCertificateFormProps) {
  const router = useRouter();
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const defaultValues: Partial<IssueCertificateFormValues> = {
    userId: initialData?.userId?.toString() || '',
    courseId: initialData?.courseId?.toString() || '',
    templateId: '',
    issueDate: new Date(),
    expiryDate: undefined,
    metadata: {},
  };

  const form = useForm<IssueCertificateFormValues>({
    resolver: zodResolver(issueCertificateSchema),
    defaultValues,
  });

  // Fetch users, courses, and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch templates
        const templatesData = await certificateApi.getTemplates();
        setTemplates(templatesData);

        // Set default template if available
        const defaultTemplate = templatesData.find(t => t.isDefault);
        if (defaultTemplate) {
          form.setValue('templateId', defaultTemplate.id.toString());
          setSelectedTemplate(defaultTemplate);
        }

        // Fetch users
        const usersData = await userApi.getUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);

        // Fetch courses if needed
        const coursesData = await courseApi.getCourses();
        setCourses(coursesData);

        // If initial user ID is provided, fetch that user
        if (initialData?.userId) {
          const user = await userApi.getUser(initialData.userId);
          if (user) {
            setSelectedUser(user);
            setFilteredUsers([user]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [form, initialData]);

  // Filter users based on search query
  useEffect(() => {
    if (!userSearchQuery) {
      setFilteredUsers(users);
      return;
    }

    const search = userSearchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.employeeId?.toLowerCase().includes(search)
    );
    setFilteredUsers(filtered);
  }, [userSearchQuery, users]);

  // Handle user search
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);

    if (query.length < 2) {
      setFilteredUsers(users);
      return;
    }

    try {
      setIsUserSearching(true);
      const data = await userApi.searchUsers(query);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsUserSearching(false);
    }
  };

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    setSelectedTemplate(template || null);
    
    // Reset custom fields when template changes
    if (template?.fields) {
      const fields: Record<string, string> = {};
      Object.keys(template.fields).forEach(key => {
        fields[key] = '';
      });
      setCustomFields(fields);
    } else {
      setCustomFields({});
    }
  };

  const onSubmit = async (data: IssueCertificateFormValues) => {
    try {
      setIsLoading(true);
      
      // Prepare certificate data
      const certificateData = {
        userId: parseInt(data.userId),
        courseId: data.courseId ? parseInt(data.courseId) : undefined,
        templateId: parseInt(data.templateId),
        expiryDate: data.expiryDate,
        metadata: {
          ...data.metadata,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        },
      };
      
      // Issue certificate
      const certificate = await certificateApi.issueCertificate(certificateData);
      
      toast.success('Certificate issued successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/certificates/${certificate.id}`);
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Details</CardTitle>
              <CardDescription>Select the recipient for this certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  User
                </label>
                <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={!!initialData?.userId}
                    >
                      {selectedUser ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{selectedUser.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span>Select user...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="w-full"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="h-[200px] w-full">
                      {isUserSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Searching...</span>
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setSelectedUser(user);
                              form.setValue('userId', user.id.toString());
                              setIsUserPopoverOpen(false);
                            }}
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No users found
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.userId && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.userId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Course (Optional)
                </label>
                <Select
                  onValueChange={(value) => form.setValue('courseId', value || "")}
                  value={form.watch('courseId') || ""}
                  disabled={!!initialData?.courseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {course.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseId && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.courseId.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>Configure the certificate settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Template
                </label>
                <Select
                  onValueChange={(value) => {
                    form.setValue('templateId', value);
                    handleTemplateChange(value);
                  }}
                  value={form.watch('templateId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {template.name}
                          {template.isDefault && (
                            <Badge variant="outline" className="ml-2">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.templateId && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.templateId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Issue Date
                  </label>
                  <Popover >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal w-full justify-start',
                          !form.watch('issueDate') && 'text-muted-foreground'
                        )}
                      >
                        {form.watch('issueDate') ? (
                          format(form.watch('issueDate'), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('issueDate') || undefined}
                        onSelect={(date) => form.setValue('issueDate', date || new Date())}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.issueDate && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.issueDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Expiry Date (Optional)
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal w-full justify-start',
                          !form.watch('expiryDate') && 'text-muted-foreground'
                        )}
                      >
                        {form.watch('expiryDate') ? (
                          format(form.watch('expiryDate'), 'PPP')
                        ) : (
                          <span>No expiry</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('expiryDate') || undefined}
                        onSelect={(date) => form.setValue('expiryDate', date)}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.expiryDate && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.expiryDate.message}
                    </p>
                  )}
                </div>
              </div>

              {selectedTemplate?.fields && Object.keys(selectedTemplate.fields).length > 0 && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-medium">Custom Fields</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedTemplate.fields).map(([key, field]) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={`field-${key}`} className="text-sm">
                          {field.label || key}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          id={`field-${key}`}
                          value={customFields[key] || ''}
                          onChange={(e) =>
                            setCustomFields((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder || `Enter ${field.label || key}`}
                          required={field.required}
                        />
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Certificate
          </Button>
        </div>
    </form>
  );
}

export default IssueCertificateForm;
