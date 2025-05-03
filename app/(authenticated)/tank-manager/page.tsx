'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cylinders');
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch data based on active tab
  const fetchData = async (tab: string) => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      switch (tab) {
        case 'cylinders':
          let cylinderQuery = supabase
            .from('cylinders')
            .select(`
              id,
              label_code,
              status,
              last_maintenance,
              warehouses(id, name)
            `);
          
          if (statusFilter) {
            cylinderQuery = cylinderQuery.eq('status', statusFilter);
          }
          
          const { data: cylinderData, error: cylinderError } = await cylinderQuery;
          
          if (cylinderError) throw cylinderError;
          setCylinders(cylinderData || []);
          break;
          
        case 'loans':
          const { data: loanData, error: loanError } = await supabase
            .from('loans')
            .select(`
              id,
              status,
              loan_date,
              expected_return_date,
              actual_return_date,
              loan_photo_url,
              return_photo_url,
              borrowers(id, full_name, phone),
              cylinders(id, label_code),
              warehouses(id, name)
            `)
            .order('created_at', { ascending: false });
          
          if (loanError) throw loanError;
          setLoans(loanData || []);
          break;
          
        case 'maintenance':
          const { data: maintenanceData, error: maintenanceError } = await supabase
            .from('maintenance_logs')
            .select(`
              id,
              performed_at,
              notes,
              photo_url,
              cylinders(id, label_code)
            `)
            .order('performed_at', { ascending: false });
          
          if (maintenanceError) throw maintenanceError;
          setMaintenanceLogs(maintenanceData || []);
          break;
      }
    } catch (err: any) {
      console.error(`Error fetching ${tab}:`, err);
      setError(`Failed to load ${tab}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchData(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
    if (activeTab === 'cylinders') {
      fetchData('cylinders');
    }
  };

  // Handle loan approval/rejection
  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('loans')
        .update({ status: newStatus })
        .eq('id', loanId);
      
      if (error) throw error;
      
      // Refresh loans data
      fetchData('loans');
    } catch (err: any) {
      console.error(`Error ${action}ing loan:`, err);
      setError(`Failed to ${action} loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding maintenance log
  const handleAddMaintenance = () => {
    router.push('/dashboard/maintenance/new');
  };

  // Handle scanning QR code
  const handleScanQR = () => {
    router.push('/scan');
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage cylinders, loans, and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleScanQR} className="rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 4a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H8zm5-3a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0V8h1a1 1 0 100-2h-1V5a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Scan QR Code
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/analytics')} className="rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Analytics
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cylinders" onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="cylinders">Cylinders</TabsTrigger>
          <TabsTrigger value="loans">Loan Requests</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Cylinders Tab */}
        <TabsContent value="cylinders">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Cylinder Inventory</CardTitle>
                  <CardDescription>Manage and track all oxygen cylinders</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange(null)}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'available' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('available')}
                  >
                    Available
                  </Button>
                  <Button
                    variant={statusFilter === 'on_loan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('on_loan')}
                  >
                    On Loan
                  </Button>
                  <Button
                    variant={statusFilter === 'reserved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange('reserved')}
                  >
                    Reserved
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">Loading cylinders...</div>
              ) : error ? (
                <div className="text-center py-10 text-destructive">{error}</div>
              ) : cylinders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No cylinders found. {statusFilter && 'Try changing the filter.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Label Code</th>
                        <th className="text-left py-3 px-4">Warehouse</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Last Maintenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cylinders.map((cylinder) => (
                        <tr key={cylinder.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{cylinder.label_code}</td>
                          <td className="py-3 px-4">{cylinder.warehouses?.name || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={cylinder.status === 'available' ? 'outline' : 'secondary'}
                              className={`
                                ${cylinder.status === 'available' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                ${cylinder.status === 'on_loan' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                                ${cylinder.status === 'reserved' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                              `}
                            >
                              {cylinder.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {cylinder.last_maintenance
                              ? new Date(cylinder.last_maintenance).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Loan Requests</CardTitle>
              <CardDescription>Manage borrower requests and active loans</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">Loading loan requests...</div>
              ) : error ? (
                <div className="text-center py-10 text-destructive">{error}</div>
              ) : loans.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No loan requests found.</div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Requests Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Pending Requests</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Borrower</th>
                            <th className="text-left py-3 px-4">Cylinder</th>
                            <th className="text-left py-3 px-4">Warehouse</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loans
                            .filter((loan) => loan.status === 'requested')
                            .map((loan) => (
                              <tr key={loan.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{loan.borrowers?.full_name || 'N/A'}</td>
                                <td className="py-3 px-4">{loan.cylinders?.label_code || 'N/A'}</td>
                                <td className="py-3 px-4">{loan.warehouses?.name || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    {loan.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleLoanAction(loan.id, 'approve')}
                                      disabled={isLoading}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLoanAction(loan.id, 'reject')}
                                      disabled={isLoading}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {loans.filter((loan) => loan.status === 'requested').length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                No pending requests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Return Requests Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Return Requests</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Borrower</th>
                            <th className="text-left py-3 px-4">Cylinder</th>
                            <th className="text-left py-3 px-4">Loan Date</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loans
                            .filter((loan) => loan.status === 'return_requested')
                            .map((loan) => (
                              <tr key={loan.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{loan.borrowers?.full_name || 'N/A'}</td>
                                <td className="py-3 px-4">{loan.cylinders?.label_code || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {loan.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Button
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                                  >
                                    Process Return
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          {loans.filter((loan) => loan.status === 'return_requested').length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                No return requests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active Loans Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Active Loans</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Borrower</th>
                            <th className="text-left py-3 px-4">Cylinder</th>
                            <th className="text-left py-3 px-4">Loan Date</th>
                            <th className="text-left py-3 px-4">Expected Return</th>
                            <th className="text-left py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loans
                            .filter((loan) => loan.status === 'on_loan' || loan.status === 'approved')
                            .map((loan) => (
                              <tr key={loan.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{loan.borrowers?.full_name || 'N/A'}</td>
                                <td className="py-3 px-4">{loan.cylinders?.label_code || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  {loan.expected_return_date
                                    ? new Date(loan.expected_return_date).toLocaleDateString()
                                    : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant="outline"
                                    className={`
                                      ${loan.status === 'on_loan' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                                      ${loan.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                    `}
                                  >
                                    {loan.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          {loans.filter((loan) => loan.status === 'on_loan' || loan.status === 'approved').length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                No active loans
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Maintenance Logs</CardTitle>
                  <CardDescription>Track cylinder maintenance history</CardDescription>
                </div>
                <Button onClick={handleAddMaintenance}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Maintenance Log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">Loading maintenance logs...</div>
              ) : error ? (
                <div className="text-center py-10 text-destructive">{error}</div>
              ) : maintenanceLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No maintenance logs found. Add a new maintenance record to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Cylinder</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Notes</th>
                        <th className="text-left py-3 px-4">Photo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{log.cylinders?.label_code || 'N/A'}</td>
                          <td className="py-3 px-4">
                            {log.performed_at ? new Date(log.performed_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">{log.notes || 'No notes'}</td>
                          <td className="py-3 px-4">
                            {log.photo_url ? (
                              <a
                                href={log.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View Photo
                              </a>
                            ) : (
                              'No photo'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}