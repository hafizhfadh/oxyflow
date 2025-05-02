'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function MaintenanceManagement() {
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [newMaintenanceLog, setNewMaintenanceLog] = useState({
    cylinder_id: '',
    performed_at: new Date().toISOString().split('T')[0],
    notes: '',
    photo_url: ''
  });
  const [editingMaintenanceLog, setEditingMaintenanceLog] = useState<any | null>(null);

  // Fetch maintenance logs and cylinders data
  useEffect(() => {
    fetchMaintenanceLogs();
    fetchCylinders();
  }, []);

  const fetchMaintenanceLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('maintenance_logs')
        .select(`
          id,
          performed_at,
          notes,
          photo_url,
          cylinder_id,
          cylinders(id, label_code)
        `)
        .order('performed_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setMaintenanceLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching maintenance logs:', err);
      setError(`Failed to load maintenance logs: ${err.message}`);
    } finally {
      setIsLoading(false);
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

  // Filter maintenance logs based on search query
  const filteredMaintenanceLogs = maintenanceLogs.filter(log => {
    const cylinderCode = log.cylinders?.label_code?.toLowerCase() || '';
    const notes = log.notes?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    
    return cylinderCode.includes(searchLower) || notes.includes(searchLower);
  });

  // Add new maintenance log
  const handleAddMaintenanceLog = async () => {
    if (!newMaintenanceLog.cylinder_id || !newMaintenanceLog.performed_at) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert([newMaintenanceLog])
        .select();
      
      if (error) throw error;
      
      // Update cylinder's last_maintenance date
      const { error: updateError } = await supabase
        .from('cylinders')
        .update({ last_maintenance: newMaintenanceLog.performed_at })
        .eq('id', newMaintenanceLog.cylinder_id);
      
      if (updateError) throw updateError;
      
      // Reset form and refresh data
      setNewMaintenanceLog({
        cylinder_id: '',
        performed_at: new Date().toISOString().split('T')[0],
        notes: '',
        photo_url: ''
      });
      setShowAddForm(false);
      fetchMaintenanceLogs();
    } catch (err: any) {
      console.error('Error adding maintenance log:', err);
      setError(`Failed to add maintenance log: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update maintenance log
  const handleUpdateMaintenanceLog = async () => {
    if (!editingMaintenanceLog) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .update({
          cylinder_id: editingMaintenanceLog.cylinder_id,
          performed_at: editingMaintenanceLog.performed_at,
          notes: editingMaintenanceLog.notes,
          photo_url: editingMaintenanceLog.photo_url
        })
        .eq('id', editingMaintenanceLog.id)
        .select();
      
      if (error) throw error;
      
      // Update cylinder's last_maintenance date if this is the most recent maintenance
      const { data: latestLog, error: latestError } = await supabase
        .from('maintenance_logs')
        .select('performed_at')
        .eq('cylinder_id', editingMaintenanceLog.cylinder_id)
        .order('performed_at', { ascending: false })
        .limit(1);
      
      if (latestError) throw latestError;
      
      if (latestLog && latestLog.length > 0 && latestLog[0].id === editingMaintenanceLog.id) {
        const { error: updateError } = await supabase
          .from('cylinders')
          .update({ last_maintenance: editingMaintenanceLog.performed_at })
          .eq('id', editingMaintenanceLog.cylinder_id);
        
        if (updateError) throw updateError;
      }
      
      // Reset form and refresh data
      setEditingMaintenanceLog(null);
      fetchMaintenanceLogs();
    } catch (err: any) {
      console.error('Error updating maintenance log:', err);
      setError(`Failed to update maintenance log: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete maintenance log
  const handleDeleteMaintenanceLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;

    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      fetchMaintenanceLogs();
    } catch (err: any) {
      console.error('Error deleting maintenance log:', err);
      setError(`Failed to delete maintenance log: ${err.message}`);
    } finally {
      setIsLoading(false);
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
        <CardTitle>Maintenance Management</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search maintenance logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Maintenance Log'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Add Maintenance Log Form */}
        {showAddForm && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Maintenance Log</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cylinder_id">Cylinder</Label>
                <select
                  id="cylinder_id"
                  value={newMaintenanceLog.cylinder_id}
                  onChange={(e) => setNewMaintenanceLog({...newMaintenanceLog, cylinder_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Cylinder</option>
                  {cylinders.map((cylinder) => (
                    <option key={cylinder.id} value={cylinder.id}>{cylinder.label_code}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="performed_at">Maintenance Date</Label>
                <Input
                  id="performed_at"
                  type="date"
                  value={newMaintenanceLog.performed_at}
                  onChange={(e) => setNewMaintenanceLog({...newMaintenanceLog, performed_at: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMaintenanceLog.notes}
                  onChange={(e) => setNewMaintenanceLog({...newMaintenanceLog, notes: e.target.value})}
                  placeholder="Maintenance details..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="photo_url">Photo URL (optional)</Label>
                <Input
                  id="photo_url"
                  value={newMaintenanceLog.photo_url}
                  onChange={(e) => setNewMaintenanceLog({...newMaintenanceLog, photo_url: e.target.value})}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddMaintenanceLog} disabled={isLoading}>Add Maintenance Log</Button>
            </div>
          </div>
        )}

        {/* Edit Maintenance Log Form */}
        {editingMaintenanceLog && (
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-4">Edit Maintenance Log</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_cylinder_id">Cylinder</Label>
                <select
                  id="edit_cylinder_id"
                  value={editingMaintenanceLog.cylinder_id}
                  onChange={(e) => setEditingMaintenanceLog({...editingMaintenanceLog, cylinder_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cylinders.map((cylinder) => (
                    <option key={cylinder.id} value={cylinder.id}>{cylinder.label_code}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit_performed_at">Maintenance Date</Label>
                <Input
                  id="edit_performed_at"
                  type="date"
                  value={editingMaintenanceLog.performed_at ? new Date(editingMaintenanceLog.performed_at).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingMaintenanceLog({...editingMaintenanceLog, performed_at: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editingMaintenanceLog.notes || ''}
                  onChange={(e) => setEditingMaintenanceLog({...editingMaintenanceLog, notes: e.target.value})}
                  placeholder="Maintenance details..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_photo_url">Photo URL</Label>
                <Input
                  id="edit_photo_url"
                  value={editingMaintenanceLog.photo_url || ''}
                  onChange={(e) => setEditingMaintenanceLog({...editingMaintenanceLog, photo_url: e.target.value})}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMaintenanceLog(null)}>Cancel</Button>
              <Button onClick={handleUpdateMaintenanceLog} disabled={isLoading}>Update Maintenance Log</Button>
            </div>
          </div>
        )}

        {/* Maintenance Logs Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading maintenance logs...</div>
        ) : filteredMaintenanceLogs.length === 0 ? (
          <div className="text-center py-4">No maintenance logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Cylinder</th>
                  <th className="text-left py-3 px-4">Maintenance Date</th>
                  <th className="text-left py-3 px-4">Notes</th>
                  <th className="text-left py-3 px-4">Photo</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenanceLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{log.cylinders?.label_code || 'N/A'}</td>
                    <td className="py-3 px-4">{formatDate(log.performed_at)}</td>
                    <td className="py-3 px-4">{log.notes || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {log.photo_url ? (
                        <a href={log.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          View Photo
                        </a>
                      ) : 'No Photo'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingMaintenanceLog(log)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteMaintenanceLog(log.id)}
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