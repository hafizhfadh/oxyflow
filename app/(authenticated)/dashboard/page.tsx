'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dashboard components
import CylindersManagement from './components/cylinders-management';
import BorrowersManagement from './components/borrowers-management';
import LoansManagement from './components/loans-management';
import MaintenanceManagement from './components/maintenance-management';
import WarehousesManagement from './components/warehouses-management';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cylinders');

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all OxyFlow data in one place</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/analytics">
            <Button variant="outline">View Analytics</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="cylinders" value={activeTab} onValueChange={handleTabChange} className="space-y-1">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="cylinders">Cylinders</TabsTrigger>
          <TabsTrigger value="borrowers">Borrowers</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="cylinders" className="space-y-4">
          <CylindersManagement />
        </TabsContent>

        <TabsContent value="borrowers" className="space-y-4">
          <BorrowersManagement />
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <LoansManagement />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceManagement />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <WarehousesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}