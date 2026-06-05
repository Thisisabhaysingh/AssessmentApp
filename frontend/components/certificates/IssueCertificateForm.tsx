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
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  // Debug popover state changes
  useEffect(() => {
    console.log('Popover state changed:', isUserPopoverOpen);
  }, [isUserPopoverOpen]);

  useEffect(() => {
    console.log('Course dropdown state changed:', isCourseDropdownOpen);
  }, [isCourseDropdownOpen]);

  useEffect(() => {
    console.log('Template dropdown state changed:', isTemplateDropdownOpen);
  }, [isTemplateDropdownOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
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

  // Refresh templates function
  const refreshTemplates = async () => {
    try {
      console.log('🔄 Refreshing templates...');
      console.log('📞 Calling certificateApi.getTemplates()...');
      const templatesData = await certificateApi.getTemplates();
      console.log('📄 API response received:', templatesData);
      console.log('📄 Refreshed templates:', templatesData);
      setTemplates(templatesData);

      // Update default template if changed
      const defaultTemplate = templatesData.find(t => t.isDefault);
      console.log('🎯 Looking for default template (isDefault: true)...');
      console.log('🎯 New default template:', defaultTemplate);
      if (defaultTemplate) {
        console.log('🎯 Found default template, updating form...');
        form.setValue('templateId', defaultTemplate.id.toString(), { shouldValidate: false, shouldDirty: false });
        setSelectedTemplate(defaultTemplate);
        console.log('✅ Updated default template:', defaultTemplate.name, 'ID:', defaultTemplate.id);
      } else {
        console.log('⚠️ No default template found!');
      }
    } catch (error) {
      console.error('❌ Error refreshing templates:', error);
      toast.error('Failed to refresh templates');
    }
  };

  // Fetch users, courses, and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch templates
        const templatesData = await certificateApi.getTemplates();
        console.log('📄 Templates loaded:', templatesData);
        setTemplates(templatesData);

        // Set default template if available
        const defaultTemplate = templatesData.find(t => t.isDefault);
        console.log('🎯 Default template found:', defaultTemplate);
        if (defaultTemplate) {
          form.setValue('templateId', defaultTemplate.id.toString(), { shouldValidate: false, shouldDirty: false });
          setSelectedTemplate(defaultTemplate);
          console.log('✅ Default template set:', defaultTemplate.name, 'ID:', defaultTemplate.id);
        }

        // Fetch users
        const usersData = await userApi.getUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);

        // Fetch courses if needed
        console.log('Fetching courses...');
        const coursesData = await courseApi.getCourses();
        console.log('Courses fetched:', coursesData);
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

  // Handle user change
  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
    setSelectedUser(user || null);
    console.log('👤 User selected:', user);
  };

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id.toString() === courseId);
    setSelectedCourse(course || null);
    console.log('📚 Course selected:', course);
  };

  const onSubmit = async (data: IssueCertificateFormValues) => {
    console.log('🚨 FORM SUBMISSION TRIGGERED!');
    console.log('📋 Form data submitted:', data);
    console.log('📄 Selected template:', selectedTemplate);
    console.log('🔍 Template ID from form:', data.templateId);
    console.log('🔍 Current templateId in form:', form.watch('templateId'));
    
    try {
      setIsLoading(true);
      
      // Prepare certificate data
      const certificateData = {
        userId: parseInt(data.userId),
        courseId: data.courseId ? parseInt(data.courseId) : null,
        templateId: parseInt(data.templateId),
        expiryDate: data.expiryDate ? data.expiryDate.toISOString() : null,
        metadata: {
          ...data.metadata,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        },
      };
      
      console.log('Sending certificate data:', certificateData);
      
      // Issue certificate
      const certificate = await certificateApi.issueCertificate(certificateData);
      console.log('Certificate issued:', certificate);
      
      toast.success(`Certificate issued successfully! Certificate ID: ${certificate.id}`);
      console.log('✅ Certificate issued successfully:', certificate);
      
      // Add download link to console for now
      console.log(`📄 Download certificate: http://localhost:4000/api/certificates/${certificate.id}/download`);
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Don't redirect to non-existent page, just show success
        console.log('Certificate created but not redirecting - page does not exist');
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to issue certificate: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Issue Certificate</h1>
            <p className="text-blue-100">Create and issue certificates to users for course completion</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-blue-100">
            <FileText className="h-8 w-8" />
            <div className="text-right">
              <div className="text-sm">Total Templates</div>
              <div className="text-xl font-bold">{templates.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Recipient Details Section */}
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Recipient Details</CardTitle>
                <CardDescription className="text-sm">Select the certificate recipient and course</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* User Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select User <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 justify-start bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                    disabled={!!initialData?.userId}
                    onClick={() => {
                      console.log('User button clicked, current state:', isUserPopoverOpen);
                      setIsUserPopoverOpen(!isUserPopoverOpen);
                    }}
                  >
                    {selectedUser ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                          {selectedUser.name}
                        </div>
                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300">
                          ID: {selectedUser.id}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>Select a user</span>
                      </div>
                    )}
                  </Button>
                  
                  {isUserPopoverOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-lg max-h-60 overflow-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('👤 User clicked:', user.name, 'ID:', user.id);
                            form.setValue('userId', user.id.toString(), { shouldValidate: false, shouldDirty: false });
                            console.log('📝 Form userId set to:', user.id.toString());
                            handleUserChange(user.id.toString());
                            setIsUserPopoverOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No users found</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Overlay to close dropdown when clicking outside */}
                  {isUserPopoverOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        console.log('Overlay clicked, closing dropdown');
                        setIsUserPopoverOpen(false);
                      }}
                    />
                  )}
                </div>
                {form.formState.errors.userId && (
                  <p className="text-sm font-medium text-red-600">
                    {form.formState.errors.userId.message}
                  </p>
                )}
              </div>

              {/* Course Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Course (Optional)
                </Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 justify-start bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                    disabled={!!initialData?.courseId}
                    onClick={() => {
                      console.log('Course button clicked, current state:', isCourseDropdownOpen);
                      setIsCourseDropdownOpen(!isCourseDropdownOpen);
                    }}
                  >
                    {form.watch('courseId') ? (
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                        {courses.find(c => c.id.toString() === form.watch('courseId'))?.name || 'Selected Course'}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>Select a course (optional)</span>
                      </div>
                    )}
                  </Button>
                  
                  {isCourseDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-lg max-h-60 overflow-auto">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('📚 Course clicked:', course.name, 'ID:', course.id);
                            form.setValue('courseId', course.id.toString(), { shouldValidate: false, shouldDirty: false });
                            console.log('📝 Form courseId set to:', course.id.toString());
                            handleCourseChange(course.id.toString());
                            setIsCourseDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{course.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{course.code}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300">
                              {course.level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {courses.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No courses available</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Overlay to close dropdown when clicking outside */}
                  {isCourseDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        console.log('Course overlay clicked, closing dropdown');
                        setIsCourseDropdownOpen(false);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Configuration Section */}
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Certificate Configuration</CardTitle>
                <CardDescription className="text-sm">Set up certificate details and fields</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Template Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                  Certificate Template <span className="text-red-500 ml-1">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Refresh button clicked!');
                    refreshTemplates();
                  }}
                  className="h-8 px-3 text-xs hover:bg-indigo-50 hover:border-indigo-300"
                >
                  🔄 Refresh
                </Button>
              </div>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 justify-start bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                  onClick={() => {
                    console.log('Template button clicked, current state:', isTemplateDropdownOpen);
                    setIsTemplateDropdownOpen(!isTemplateDropdownOpen);
                  }}
                >
                  {form.watch('templateId') ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                        {templates.find(t => t.id.toString() === form.watch('templateId'))?.name || 'Selected Template'}
                      </div>
                      {templates.find(t => t.id.toString() === form.watch('templateId'))?.isDefault && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">
                          Default
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Select a certificate template</span>
                    </div>
                  )}
                </Button>
                
                {isTemplateDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-lg max-h-60 overflow-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('📄 Template clicked:', template.name, 'ID:', template.id);
                          form.setValue('templateId', template.id.toString(), { shouldValidate: false, shouldDirty: false });
                          console.log('📝 Form templateId set to:', template.id.toString());
                          handleTemplateChange(template.id.toString());
                          setIsTemplateDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                            {template.name}
                          </div>
                          {template.isDefault && (
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No templates available</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Overlay to close dropdown when clicking outside */}
                {isTemplateDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      console.log('Template overlay clicked, closing dropdown');
                      setIsTemplateDropdownOpen(false);
                    }}
                  />
                )}
              </div>
              {form.formState.errors.templateId && (
                <p className="text-sm font-medium text-red-600">
                  {form.formState.errors.templateId.message}
                </p>
              )}
            </div>

            {/* Date Fields */}
            <div className="space-y-6">
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                  Schedule
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                      Issue Date <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-11 justify-start text-left bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
                            !form.watch('issueDate') && 'text-gray-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch('issueDate') ? (
                            format(form.watch('issueDate'), 'MMM dd, yyyy')
                          ) : (
                            <span>Select issue date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch('issueDate') || undefined}
                          onSelect={(date) => form.setValue('issueDate', date || new Date())}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-orange-600" />
                      Expiry Date <span className="text-gray-400 ml-1">(Optional)</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-11 justify-start text-left bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
                            !form.watch('expiryDate') && 'text-gray-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch('expiryDate') ? (
                            format(form.watch('expiryDate'), 'MMM dd, yyyy')
                          ) : (
                            <span>No expiry date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch('expiryDate') || undefined}
                          onSelect={(date) => form.setValue('expiryDate', date)}
                          disabled={(date) => date <= new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            {selectedTemplate?.fields && Object.keys(selectedTemplate.fields).length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                  Custom Template Fields
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(selectedTemplate.fields).map(([key, field]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`field-${key}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label || key}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
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
                        className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      />
                      {field.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
                      )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Certificate
          </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default IssueCertificateForm;
