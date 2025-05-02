'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCylinders: 0,
    availableCylinders: 0,
    onLoanCylinders: 0,
    reservedCylinders: 0,
    totalLoans: 0,
    overdueLoans: 0,
    avgLoanDuration: 0,
    monthlyLoans: [] as { month: string; count: number }[],
    warehouseStats: [] as { name: string; total: number; available: number; onLoan: number }[],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch cylinder counts by status
        const { data: cylinderStats, error: cylinderError } = await supabase
          .from('cylinders')
          .select('status, count')
          .select('status')
          .select('status', { count: 'exact' })
          .group('status');

        if (cylinderError) throw cylinderError;

        // Fetch warehouse stats
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouses')
          .select(`
            id,
            name,
            cylinders!inner(status)
          `);

        if (warehouseError) throw warehouseError;

        // Process warehouse data
        const warehouseStats = warehouseData.map((warehouse) => {
          const cylinders = warehouse.cylinders || [];
          const total = cylinders.length;
          const available = cylinders.filter((c: any) => c.status === 'available').length;
          const onLoan = cylinders.filter((c: any) => c.status === 'on_loan').length;

          return {
            name: warehouse.name,
            total,
            available,
            onLoan,
          };
        });

        // Fetch loan stats
        const { data: loanStats, error: loanError } = await supabase
          .from('loans')
          .select('status, loan_date, actual_return_date, expected_return_date');

        if (loanError) throw loanError;

        // Calculate average loan duration (for completed loans)
        const completedLoans = loanStats.filter(
          (loan) => loan.status === 'returned' && loan.loan_date && loan.actual_return_date
        );

        let avgDuration = 0;
        if (completedLoans.length > 0) {
          const totalDays = completedLoans.reduce((sum, loan) => {
            const loanDate = new Date(loan.loan_date);
            const returnDate = new Date(loan.actual_return_date);
            const days = Math.round((returnDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgDuration = Math.round(totalDays / completedLoans.length);
        }

        // Count overdue loans
        const now = new Date();
        const overdueLoans = loanStats.filter(
          (loan) =>
            (loan.status === 'on_loan' || loan.status === 'approved') &&
            loan.expected_return_date &&
            new Date(loan.expected_return_date) < now
        ).length;

        // Calculate monthly loans for the past 6 months
        const monthlyLoans = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = month.toLocaleString('default', { month: 'short' });
          const year = month.getFullYear();
          const monthLabel = `${monthName} ${year}`;

          const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
          const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

          const count = loanStats.filter(
            (loan) =>
              loan.loan_date &&
              new Date(loan.loan_date) >= startDate &&
              new Date(loan.loan_date) <= endDate
          ).length;

          monthlyLoans.push({ month: monthLabel, count });
        }

        // Compile all stats
        setStats({
          totalCylinders: cylinderStats.reduce((sum: number, item: any) => sum + item.count, 0),
          availableCylinders: cylinderStats.find((item: any) => item.status === 'available')?.count || 0,
          onLoanCylinders: cylinderStats.find((item: any) => item.status === 'on_loan')?.count || 0,
          reservedCylinders: cylinderStats.find((item: any) => item.status === 'reserved')?.count || 0,
          totalLoans: loanStats.length,
          overdueLoans,
          avgLoanDuration: avgDuration,
          monthlyLoans,
          warehouseStats,
        });
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Helper function to render a simple bar chart
  const renderBarChart = (data: { month: string; count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count), 1);

    return (
      <div className="flex items-end h-40 gap-2">
        {data.map((item, index) => {
          const height = (item.count / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex justify-center mb-1">
                <span className="text-xs font-medium">{item.count}</span>
              </div>
              <div
                className="w-full bg-primary/80 rounded-t-md"
                style={{ height: `${height}%` }}
              ></div>
              <div className="w-full text-center mt-2">
                <span className="text-xs">{item.month}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to render a simple pie chart
  const renderStatusChart = () => {
    const total = stats.totalCylinders;
    if (total === 0) return <div className="text-center py-10">No data available</div>;

    const available = (stats.availableCylinders / total) * 100;
    const onLoan = (stats.onLoanCylinders / total) * 100;
    const reserved = (stats.reservedCylinders / total) * 100;

    return (
      <div className="flex justify-center py-4">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Available */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="hsl(var(--chart-1))"
              strokeWidth="20"
              strokeDasharray={`${available} ${100 - available}`}
              strokeDashoffset="25"
              className="transition-all duration-500"
            />
            {/* On Loan */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="hsl(var(--chart-2))"
              strokeWidth="20"
              strokeDasharray={`${onLoan} ${100 - onLoan}`}
              strokeDashoffset={`${-available + 25}`}
              className="transition-all duration-500"
            />
            {/* Reserved */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="hsl(var(--chart-3))"
              strokeWidth="20"
              strokeDasharray={`${reserved} ${100 - reserved}`}
              strokeDashoffset={`${-(available + onLoan) + 25}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of cylinder usage and loan statistics</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Loading analytics data...</div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cylinder Status Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Cylinder Status</CardTitle>
              <CardDescription>Distribution of cylinder statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStatusChart()}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))] mr-2"></div>
                  <span className="text-sm">Available ({stats.availableCylinders})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))] mr-2"></div>
                  <span className="text-sm">On Loan ({stats.onLoanCylinders})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))] mr-2"></div>
                  <span className="text-sm">Reserved ({stats.reservedCylinders})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Loans Chart */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Loans</CardTitle>
              <CardDescription>Number of loans per month</CardDescription>
            </CardHeader>
            <CardContent>{renderBarChart(stats.monthlyLoans)}</CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Important statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Loans:</span>
                  <span className="font-medium">{stats.totalLoans}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overdue Loans:</span>
                  <span className="font-medium text-destructive">{stats.overdueLoans}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Loan Duration:</span>
                  <span className="font-medium">{stats.avgLoanDuration} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Statistics */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Warehouse Statistics</CardTitle>
              <CardDescription>Cylinder distribution by warehouse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Warehouse</th>
                      <th className="text-left py-2 px-4">Total</th>
                      <th className="text-left py-2 px-4">Available</th>
                      <th className="text-left py-2 px-4">On Loan</th>
                      <th className="text-left py-2 px-4">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.warehouseStats.map((warehouse, index) => {
                      const utilization = warehouse.total > 0 ? (warehouse.onLoan / warehouse.total) * 100 : 0;
                      return (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{warehouse.name}</td>
                          <td className="py-2 px-4">{warehouse.total}</td>
                          <td className="py-2 px-4">{warehouse.available}</td>
                          <td className="py-2 px-4">{warehouse.onLoan}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mr-2">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${utilization}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{Math.round(utilization)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {stats.warehouseStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No warehouse data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}