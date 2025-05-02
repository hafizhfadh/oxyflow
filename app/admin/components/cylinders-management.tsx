'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function CylindersManagement() {
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCylinder, setNewCylinder] = useState({
    label_code: '',
    warehouse_id: '',
    status: 'available',
  });
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [editingCylinder, setEditingCylinder] = useState<any | null>(null);

  // Fetch cylinders and warehouses data
  useEffect(() => {
    fetchCylinders();
    fetchWarehouses();
  }, [statusFilter]);

  const fetchCylinders = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      let query = supabase
        .from('cylinders')
        .select(`
          id,
          label_code,
          status,
          last_maintenance,
          warehouse_id,
          warehouses(id, name)
        `);
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setCylinders(data || []);
    } catch (err: any) {
      console.error('Error fetching cylinders:', err);
      setError(`Failed to load cylinders: ${err.message}`);
    } finally {
      setIsLoading(false);
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

  // Filter cylinders based on search query
  const filteredCylinders = cylinders.filter(cylinder => 
    cylinder.label_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add new cylinder
  const handleAddCylinder = async () => {
    if (!newCylinder.label_code || !newCylinder.warehouse_id) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('cylinders')
        .insert([
          {
            label_code: newCylinder.label_code,
            warehouse_id: newCylinder.warehouse_id,
            status: newCylinder.status,
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setNewCylinder({
        label_code: '',
        warehouse_id: '',
        status: 'available',
      });
      setShowAddForm(false);
      fetchCylinders();
    } catch (err: any) {
      console.error('Error adding cylinder:', err);
      setError(`Failed to add cylinder: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update cylinder
  const handleUpdateCylinder = async () => {
    if (!editingCylinder) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('cylinders')
        .update({
          label_code: editingCylinder.label_code,
          warehouse_id: editingCylinder.warehouse_id,
          status: editingCylinder.status,
        })
        .eq('id', editingCylinder.id)
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setEditingCylinder(null);
      fetchCylinders();
    } catch (err: any) {
      console.error('Error updating cylinder:', err);
      setError(`Failed to update cylinder: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete cylinder
  const handleDeleteCylinder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cylinder?')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('cylinders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      fetchCylinders();
    } catch (err: any) {
      console.error('Error deleting cylinder:', err);
      setError(`Failed to delete cylinder: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'on_loan':
        return <Badge className="bg-blue-500">On Loan</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-500">Reserved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cylinders Management</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search cylinders..."
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
                <DropdownMenuItem onClick={() => setStatusFilter('available')}>Available</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('on_loan')}>On Loan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('reserved')}>Reserved</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Cylinder'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Add Cylinder Form */}
        {showAddForm && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Cylinder</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="label_code">Cylinder Code</Label>
                <Input
                  id="label_code"
                  value={newCylinder.label_code}
                  onChange={(e) => setNewCylinder({...newCylinder, label_code: e.target.value})}
                  placeholder="CYL-123"
                />
              </div>
              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <select
                  id="warehouse"
                  value={newCylinder.warehouse_id}
                  onChange={(e) => setNewCylinder({...newCylinder, warehouse_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newCylinder.status}
                  onChange={(e) => setNewCylinder({...newCylinder, status: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="available">Available</option>
                  <option value="on_loan">On Loan</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddCylinder} disabled={isLoading}>Add Cylinder</Button>
            </div>
          </div>
        )}

        {/* Edit Cylinder Form */}
        {editingCylinder && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Edit Cylinder</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_label_code">Cylinder Code</Label>
                <Input
                  id="edit_label_code"
                  value={editingCylinder.label_code}
                  onChange={(e) => setEditingCylinder({...editingCylinder, label_code: e.target.value})}
                  placeholder="CYL-123"
                />
              </div>
              <div>
                <Label htmlFor="edit_warehouse">Warehouse</Label>
                <select
                  id="edit_warehouse"
                  value={editingCylinder.warehouse_id}
                  onChange={(e) => setEditingCylinder({...editingCylinder, warehouse_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <select
                  id="edit_status"
                  value={editingCylinder.status}
                  onChange={(e) => setEditingCylinder({...editingCylinder, status: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="available">Available</option>
                  <option value="on_loan">On Loan</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCylinder(null)}>Cancel</Button>
              <Button onClick={handleUpdateCylinder} disabled={isLoading}>Update Cylinder</Button>
            </div>
          </div>
        )}

        {/* Cylinders Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading cylinders...</div>
        ) : filteredCylinders.length === 0 ? (
          <div className="text-center py-4">No cylinders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Cylinder Code</th>
                  <th className="text-left py-3 px-4">Warehouse</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Maintenance</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCylinders.map((cylinder) => (
                  <tr key={cylinder.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{cylinder.label_code}</td>
                    <td className="py-3 px-4">{cylinder.warehouses?.name || 'N/A'}</td>
                    <td className="py-3 px-4">{getStatusBadge(cylinder.status)}</td>
                    <td className="py-3 px-4">
                      {cylinder.last_maintenance 
                        ? new Date(cylinder.last_maintenance).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCylinder(cylinder)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteCylinder(cylinder.id)}
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