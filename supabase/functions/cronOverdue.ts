// Edge function to detect overdue loans and send notifications
// This function is scheduled to run nightly

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    // Check for secret token to authorize the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Find all overdue loans (expected_return_date < now and status is on_loan or approved)
    const now = new Date().toISOString();
    const { data: overdueLoans, error: loansError } = await supabase
      .from('loans')
      .select(`
        id,
        status,
        expected_return_date,
        borrowers(full_name, phone),
        cylinders(label_code),
        warehouses(name)
      `)
      .in('status', ['on_loan', 'approved'])
      .lt('expected_return_date', now);

    if (loansError) {
      throw loansError;
    }

    // 2. Update loan status to 'overdue'
    if (overdueLoans && overdueLoans.length > 0) {
      const overdueIds = overdueLoans.map((loan) => loan.id);
      const { error: updateError } = await supabase
        .from('loans')
        .update({ status: 'overdue' })
        .in('id', overdueIds);

      if (updateError) {
        throw updateError;
      }

      // 3. Log overdue loans (in a real app, this would send emails or SMS)
      console.log(`Found ${overdueLoans.length} overdue loans:`);
      for (const loan of overdueLoans) {
        console.log(`- Loan ID: ${loan.id}`);
        console.log(`  Borrower: ${loan.borrowers?.full_name}`);
        console.log(`  Phone: ${loan.borrowers?.phone}`);
        console.log(`  Cylinder: ${loan.cylinders?.label_code}`);
        console.log(`  Warehouse: ${loan.warehouses?.name}`);
        console.log(`  Expected Return: ${new Date(loan.expected_return_date).toLocaleDateString()}`);
        console.log('---');

        // In a production app, you would send notifications here
        // Example: await sendSMS(loan.borrowers.phone, `Your oxygen cylinder ${loan.cylinders.label_code} is overdue.`);
      }
    }

    // 4. Find cylinders that need maintenance (last_maintenance older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

    const { data: maintenanceCylinders, error: maintenanceError } = await supabase
      .from('cylinders')
      .select(`
        id,
        label_code,
        last_maintenance,
        warehouses(name)
      `)
      .or(`last_maintenance.lt.${ninetyDaysAgoISO},last_maintenance.is.null`);

    if (maintenanceError) {
      throw maintenanceError;
    }

    // 5. Log cylinders needing maintenance and send notifications
    if (maintenanceCylinders && maintenanceCylinders.length > 0) {
      console.log(`Found ${maintenanceCylinders.length} cylinders needing maintenance:`);
      for (const cylinder of maintenanceCylinders) {
        console.log(`- Cylinder: ${cylinder.label_code}`);
        console.log(`  Warehouse: ${cylinder.warehouses?.name}`);
        console.log(`  Last Maintenance: ${cylinder.last_maintenance ? new Date(cylinder.last_maintenance).toLocaleDateString() : 'Never'}`);
        console.log('---');

        // Calculate days since last maintenance
        const daysSinceLastMaintenance = cylinder.last_maintenance
          ? Math.ceil((new Date().getTime() - new Date(cylinder.last_maintenance).getTime()) / (1000 * 3600 * 24))
          : null;
        
        // In a real app, you would get the staff email from a settings table
        // For now, we'll use a placeholder
        const staffEmail = 'staff@example.com'; // This would come from a database in production
        
        // Send notification to staff
        await sendMaintenanceNotification(
          staffEmail,
          cylinder.label_code,
          cylinder.warehouses?.name || 'Unknown',
          daysSinceLastMaintenance
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        overdueLoans: overdueLoans?.length || 0,
        maintenanceCylinders: maintenanceCylinders?.length || 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in cronOverdue function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});