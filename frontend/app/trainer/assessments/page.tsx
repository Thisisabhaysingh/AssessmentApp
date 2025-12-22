'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, User, BookOpen, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Assessment {
  id: number;
  course: {
    id: number;
    name: string;
    code: string;
  };
  trainer: {
    id: number;
    name: string;
    email: string;
  };
  manager: {
    id: number;
    name: string;
    email: string;
  } | null;
  scheduled_date: string;
  status: 'Scheduled' | 'Completed';
  clear_status: 'Pass' | 'Fail' | null;
  score: number | null;
  feedback?: {
    id: number;
    rating: number;
    comments: string;
    manager: {
      id: number;
      name: string;
    };
  } | null;
}

export default function TrainerAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [score, setScore] = useState<string>('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response: any = await api.trainer.assessments();
      setAssessments(response.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assessmentId: number, clearStatus: 'Pass' | 'Fail') => {
    try {
      setUpdatingId(assessmentId);

      const updateData: any = {
        clear_status: clearStatus
      };

      if (score && !isNaN(Number(score))) {
        updateData.score = Number(score);
      }

      await api.trainer.updateAssessmentStatus(assessmentId, updateData);

      toast.success(`Assessment marked as ${clearStatus === 'Pass' ? 'Passed' : 'Failed'}!`);
      if (clearStatus === 'Pass') {
        toast.success('Certificate has been automatically generated!');
        // Force refresh the certificates page to show the new certificate
        setTimeout(() => {
          window.location.href = '/trainer/certificates?refresh=' + Date.now();
        }, 2000);
      }

      setScore('');
      fetchAssessments();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (assessment: Assessment) => {
    if (assessment.status === 'Completed') {
      if (assessment.clear_status === 'Pass') {
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      } else if (assessment.clear_status === 'Fail') {
        return <Badge variant="destructive">Failed</Badge>;
      }
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Assessments</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and update your assessment status
        </p>
      </div>

      {assessments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any scheduled assessments yet.
            </p>
            <Button onClick={() => router.push('/admin/assessments')}>
              Contact Admin to Schedule Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {assessment.course.name}
                      {assessment.course.code && (
                        <Badge variant="outline">{assessment.course.code}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Scheduled for {format(new Date(assessment.scheduled_date), 'PPP')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(assessment)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Manager:</span>
                    <span>{assessment.manager?.name || 'Not assigned'}</span>
                  </div>
                  {assessment.score && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-semibold">{assessment.score}/100</span>
                    </div>
                  )}
                </div>

                {assessment.status === 'Scheduled' && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Mark Assessment as Completed</h4>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                      <div className="flex-1">
                        <Label htmlFor={`score-${assessment.id}`}>Score (optional)</Label>
                        <Input
                          id={`score-${assessment.id}`}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Enter score out of 100"
                          value={score}
                          onChange={(e) => setScore(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(assessment.id, 'Fail')}
                          disabled={updatingId === assessment.id}
                          className="flex-1 sm:flex-none"
                        >
                          {updatingId === assessment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark as Failed
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus(assessment.id, 'Pass')}
                          disabled={updatingId === assessment.id}
                          className="flex-1 sm:flex-none"
                        >
                          {updatingId === assessment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark as Passed
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {assessment.clear_status === 'Pass' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <Award className="h-4 w-4" />
                      <span className="font-medium">Assessment Passed!</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      A certificate has been automatically generated and added to your certificates.
                    </p>
                  </div>
                )}

                {assessment.feedback && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Manager Feedback</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Rating: {assessment.feedback.rating}/5</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assessment.feedback.comments}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        - {assessment.feedback.manager.name}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
