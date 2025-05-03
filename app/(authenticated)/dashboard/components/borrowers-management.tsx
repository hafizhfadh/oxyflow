'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BorrowersManagement() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBorrower, setNewBorrower] = useState({
    full_name: '',
    ktp_number: '',
    phone: '',
    address: ''
  });
  const [editingBorrower, setEditingBorrower] = useState<any | null>(null);

  // Fetch borrowers data
  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('borrowers')
        .select('*')
        .order('full_name');
      
      if (fetchError) throw fetchError;
      setBorrowers(data || []);
    } catch (err: any) {
      console.error('Error fetching borrowers:', err);
      setError(`Failed to load borrowers: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter borrowers based on search query
  const filteredBorrowers = borrowers.filter(borrower => 
    borrower.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    borrower.ktp_number.includes(searchQuery) ||
    borrower.phone.includes(searchQuery)
  );

  // Add new borrower
  const handleAddBorrower = async () => {
    if (!newBorrower.full_name || !newBorrower.ktp_number || !newBorrower.phone || !newBorrower.address) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('borrowers')
        .insert([newBorrower])
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setNewBorrower({
        full_name: '',
        ktp_number: '',
        phone: '',
        address: ''
      });
      setShowAddForm(false);
      fetchBorrowers();
    } catch (err: any) {
      console.error('Error adding borrower:', err);
      setError(`Failed to add borrower: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update borrower
  const handleUpdateBorrower = async () => {
    if (!editingBorrower) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('borrowers')
        .update({
          full_name: editingBorrower.full_name,
          ktp_number: editingBorrower.ktp_number,
          phone: editingBorrower.phone,
          address: editingBorrower.address
        })
        .eq('id', editingBorrower.id)
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setEditingBorrower(null);
      fetchBorrowers();
    } catch (err: any) {
      console.error('Error updating borrower:', err);
      setError(`Failed to update borrower: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete borrower
  const handleDeleteBorrower = async (id: string) => {
    if (!confirm('Are you sure you want to delete this borrower? This will also delete all associated loans.')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('borrowers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      fetchBorrowers();
    } catch (err: any) {
      console.error('Error deleting borrower:', err);
      setError(`Failed to delete borrower: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Borrowers Management</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search borrowers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Borrower'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Add Borrower Form */}
        {showAddForm && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Borrower</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newBorrower.full_name}
                  onChange={(e) => setNewBorrower({...newBorrower, full_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="ktp_number">KTP Number</Label>
                <Input
                  id="ktp_number"
                  value={newBorrower.ktp_number}
                  onChange={(e) => setNewBorrower({...newBorrower, ktp_number: e.target.value})}
                  placeholder="1234567890123456"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newBorrower.phone}
                  onChange={(e) => setNewBorrower({...newBorrower, phone: e.target.value})}
                  placeholder="+62123456789"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newBorrower.address}
                  onChange={(e) => setNewBorrower({...newBorrower, address: e.target.value})}
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddBorrower} disabled={isLoading}>Add Borrower</Button>
            </div>
          </div>
        )}

        {/* Edit Borrower Form */}
        {editingBorrower && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Edit Borrower</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editingBorrower.full_name}
                  onChange={(e) => setEditingBorrower({...editingBorrower, full_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="edit_ktp_number">KTP Number</Label>
                <Input
                  id="edit_ktp_number"
                  value={editingBorrower.ktp_number}
                  onChange={(e) => setEditingBorrower({...editingBorrower, ktp_number: e.target.value})}
                  placeholder="1234567890123456"
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone Number</Label>
                <Input
                  id="edit_phone"
                  value={editingBorrower.phone}
                  onChange={(e) => setEditingBorrower({...editingBorrower, phone: e.target.value})}
                  placeholder="+62123456789"
                />
              </div>
              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={editingBorrower.address}
                  onChange={(e) => setEditingBorrower({...editingBorrower, address: e.target.value})}
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingBorrower(null)}>Cancel</Button>
              <Button onClick={handleUpdateBorrower} disabled={isLoading}>Update Borrower</Button>
            </div>
          </div>
        )}

        {/* Borrowers Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading borrowers...</div>
        ) : filteredBorrowers.length === 0 ? (
          <div className="text-center py-4">No borrowers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Full Name</th>
                  <th className="text-left py-3 px-4">KTP Number</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Address</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{borrower.full_name}</td>
                    <td className="py-3 px-4">{borrower.ktp_number}</td>
                    <td className="py-3 px-4">{borrower.phone}</td>
                    <td className="py-3 px-4">{borrower.address}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingBorrower(borrower)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteBorrower(borrower.id)}
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