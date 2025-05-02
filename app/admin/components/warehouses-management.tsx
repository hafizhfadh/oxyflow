'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WarehousesManagement() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    address: '',
    lat: '',
    lon: '',
    contact: ''
  });
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);

  // Fetch warehouses data
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      
      if (fetchError) throw fetchError;
      setWarehouses(data || []);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      setError(`Failed to load warehouses: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter warehouses based on search query
  const filteredWarehouses = warehouses.filter(warehouse => 
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add new warehouse
  const handleAddWarehouse = async () => {
    if (!newWarehouse.name || !newWarehouse.address || !newWarehouse.lat || !newWarehouse.lon) {
      setError('Please fill all required fields');
      return;
    }

    // Validate latitude and longitude
    const lat = parseFloat(newWarehouse.lat);
    const lon = parseFloat(newWarehouse.lon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180)');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert([{
          name: newWarehouse.name,
          address: newWarehouse.address,
          lat: lat,
          lon: lon,
          contact: newWarehouse.contact
        }])
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setNewWarehouse({
        name: '',
        address: '',
        lat: '',
        lon: '',
        contact: ''
      });
      setShowAddForm(false);
      fetchWarehouses();
    } catch (err: any) {
      console.error('Error adding warehouse:', err);
      setError(`Failed to add warehouse: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update warehouse
  const handleUpdateWarehouse = async () => {
    if (!editingWarehouse) return;

    // Validate latitude and longitude
    const lat = parseFloat(editingWarehouse.lat);
    const lon = parseFloat(editingWarehouse.lon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180)');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .update({
          name: editingWarehouse.name,
          address: editingWarehouse.address,
          lat: lat,
          lon: lon,
          contact: editingWarehouse.contact
        })
        .eq('id', editingWarehouse.id)
        .select();
      
      if (error) throw error;
      
      // Reset form and refresh data
      setEditingWarehouse(null);
      fetchWarehouses();
    } catch (err: any) {
      console.error('Error updating warehouse:', err);
      setError(`Failed to update warehouse: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete warehouse
  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse? This will also delete all associated cylinders and loans.')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      fetchWarehouses();
    } catch (err: any) {
      console.error('Error deleting warehouse:', err);
      setError(`Failed to delete warehouse: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Warehouses Management</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search warehouses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Warehouse'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Add Warehouse Form */}
        {showAddForm && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Warehouse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})}
                  placeholder="Main Warehouse"
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Information</Label>
                <Input
                  id="contact"
                  value={newWarehouse.contact}
                  onChange={(e) => setNewWarehouse({...newWarehouse, contact: e.target.value})}
                  placeholder="+62123456789 or email@example.com"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newWarehouse.address}
                  onChange={(e) => setNewWarehouse({...newWarehouse, address: e.target.value})}
                  placeholder="123 Main St, City, Province"
                />
              </div>
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  value={newWarehouse.lat}
                  onChange={(e) => setNewWarehouse({...newWarehouse, lat: e.target.value})}
                  placeholder="-6.2088"
                />
              </div>
              <div>
                <Label htmlFor="lon">Longitude</Label>
                <Input
                  id="lon"
                  value={newWarehouse.lon}
                  onChange={(e) => setNewWarehouse({...newWarehouse, lon: e.target.value})}
                  placeholder="106.8456"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddWarehouse} disabled={isLoading}>Add Warehouse</Button>
            </div>
          </div>
        )}

        {/* Edit Warehouse Form */}
        {editingWarehouse && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Edit Warehouse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Warehouse Name</Label>
                <Input
                  id="edit_name"
                  value={editingWarehouse.name}
                  onChange={(e) => setEditingWarehouse({...editingWarehouse, name: e.target.value})}
                  placeholder="Main Warehouse"
                />
              </div>
              <div>
                <Label htmlFor="edit_contact">Contact Information</Label>
                <Input
                  id="edit_contact"
                  value={editingWarehouse.contact || ''}
                  onChange={(e) => setEditingWarehouse({...editingWarehouse, contact: e.target.value})}
                  placeholder="+62123456789 or email@example.com"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={editingWarehouse.address}
                  onChange={(e) => setEditingWarehouse({...editingWarehouse, address: e.target.value})}
                  placeholder="123 Main St, City, Province"
                />
              </div>
              <div>
                <Label htmlFor="edit_lat">Latitude</Label>
                <Input
                  id="edit_lat"
                  value={editingWarehouse.lat}
                  onChange={(e) => setEditingWarehouse({...editingWarehouse, lat: e.target.value})}
                  placeholder="-6.2088"
                />
              </div>
              <div>
                <Label htmlFor="edit_lon">Longitude</Label>
                <Input
                  id="edit_lon"
                  value={editingWarehouse.lon}
                  onChange={(e) => setEditingWarehouse({...editingWarehouse, lon: e.target.value})}
                  placeholder="106.8456"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingWarehouse(null)}>Cancel</Button>
              <Button onClick={handleUpdateWarehouse} disabled={isLoading}>Update Warehouse</Button>
            </div>
          </div>
        )}

        {/* Warehouses Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading warehouses...</div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="text-center py-4">No warehouses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Address</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Coordinates</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{warehouse.name}</td>
                    <td className="py-3 px-4">{warehouse.address}</td>
                    <td className="py-3 px-4">{warehouse.contact || 'N/A'}</td>
                    <td className="py-3 px-4">{`${warehouse.lat}, ${warehouse.lon}`}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingWarehouse(warehouse)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteWarehouse(warehouse.id)}
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