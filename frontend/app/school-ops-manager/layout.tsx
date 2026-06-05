import DashboardLayout from '@/components/DashboardLayout';

export default function SchoolOpsManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role="school_ops_manager">
      {children}
    </DashboardLayout>
  );
}
