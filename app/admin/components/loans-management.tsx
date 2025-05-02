'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function LoansManagement() {
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);

  // Fetch loans and related data
  useEffect(() => {
    fetchLoans();
    fetchBorrowers();
    fetchCylinders();
    fetchWarehouses();
  }, [statusFilter]);

  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      let query = supabase
        .from('loans')
        .select(`
          id,
          status,
          loan_date,
          expected_return_date,
          actual_return_date,
          loan_photo_url,
          return_photo_url,
          borrower_id,
          cylinder_id,
          warehouse_id,
          borrowers(id, full_name, phone),
          cylinders(id, label_code),
          warehouses(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setLoans(data || []);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      setError(`Failed to load loans: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBorrowers = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('borrowers')
        .select('id, full_name');
      
      if (error) throw error;
      setBorrowers(data || []);
    } catch (err: any) {
      console.error('Error fetching borrowers:', err);
    }
  };

  const fetchCylinders = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('cylinders')
        .select('id, label_code');
      
      if (error) throw error;
      setCylinders(data || []);
    } catch (err: any) {
      console.error('Error fetching cylinders:', err);
    }
  };

  const fetchWarehouses = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name');
      
      if (error) throw error;
      setWarehouses(data || []);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
    }
  };

  // Filter loans based on search query
  const filteredLoans = loans.filter(loan => {
    const borrowerName = loan.borrowers?.full_name?.toLowerCase() || '';
    const cylinderCode = loan.cylinders?.label_code?.toLowerCase() || '';
    const warehouseName = loan.warehouses?.name?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    
    return borrowerName.includes(searchLower) || 
           cylinderCode.includes(searchLower) || 
           warehouseName.includes(searchLower);
  });

  // Update loan
  const handleUpdateLoan = async () => {
    if (!editingLoan) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({
          status: editingLoan.status,
          expected_return_date: editingLoan.expected_return_date,
          actual_return_date: editingLoan.status === 'returned' ? new Date().toISOString() : editingLoan.actual_return_date
        })
        .eq('id', editingLoan.id)
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setEditingLoan(null);
      fetchLoans();
    } catch (err: any) {
      console.error('Error updating loan:', err);
      setError(`Failed to update loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark loan as returned
  const handleMarkAsReturned = async (id: string) => {
    if (!confirm('Are you sure you want to mark this loan as returned?')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Refresh data
      fetchLoans();
    } catch (err: any) {
      console.error('Error updating loan:', err);
      setError(`Failed to update loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete loan
  const handleDeleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      fetchLoans();
    } catch (err: any) {
      console.error('Error deleting loan:', err);
      setError(`Failed to delete loan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge className="bg-purple-500">Requested</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Approved</Badge>;
      case 'on_loan':
        return <Badge className="bg-yellow-500">On Loan</Badge>;
      case 'return_requested':
        return <Badge className="bg-orange-500">Return Requested</Badge>;
      case 'returned':
        return <Badge className="bg-green-500">Returned</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Loans Management</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {statusFilter ? `Status: ${statusFilter}` : 'All Statuses'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('requested')}>Requested</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('on_loan')}>On Loan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('return_requested')}>Return Requested</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('returned')}>Returned</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('overdue')}>Overdue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Edit Loan Form */}
        {editingLoan && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Edit Loan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <select
                  id="edit_status"
                  value={editingLoan.status}
                  onChange={(e) => setEditingLoan({...editingLoan, status: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="on_loan">On Loan</option>
                  <option value="return_requested">Return Requested</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit_expected_return_date">Expected Return Date</Label>
                <Input
                  id="edit_expected_return_date"
                  type="date"
                  value={editingLoan.expected_return_date ? new Date(editingLoan.expected_return_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingLoan({...editingLoan, expected_return_date: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingLoan(null)}>Cancel</Button>
              <Button onClick={handleUpdateLoan} disabled={isLoading}>Update Loan</Button>
            </div>
          </div>
        )}

        {/* Loans Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading loans...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-4">No loans found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Borrower</th>
                  <th className="text-left py-3 px-4">Cylinder</th>
                  <th className="text-left py-3 px-4">Warehouse</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Loan Date</th>
                  <th className="text-left py-3 px-4">Expected Return</th>
                  <th className="text-left py-3 px-4">Actual Return</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{loan.borrowers?.full_name || 'N/A'}</td>
                    <td className="py-3 px-4">{loan.cylinders?.label_code || 'N/A'}</td>
                    <td className="py-3 px-4">{loan.warehouses?.name || 'N/A'}</td>
                    <td className="py-3 px-4">{getStatusBadge(loan.status)}</td>
                    <td className="py-3 px-4">{formatDate(loan.loan_date)}</td>
                    <td className="py-3 px-4">{formatDate(loan.expected_return_date)}</td>
                    <td className="py-3 px-4">{formatDate(loan.actual_return_date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingLoan(loan)}
                        >
                          Edit
                        </Button>
                        {(loan.status === 'on_loan' || loan.status === 'approved' || loan.status === 'return_requested' || loan.status === 'overdue') && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleMarkAsReturned(loan.id)}
                          >
                            Mark Returned
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteLoan(loan.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}