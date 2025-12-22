'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IssueCertificateForm from '@/components/certificates/IssueCertificateForm';

export default function AdminIssueCertificatePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Issue Certificate</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manually issue a certificate to a user for completing a course
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border">
        <IssueCertificateForm />
      </div>
    </div>
  );
}
