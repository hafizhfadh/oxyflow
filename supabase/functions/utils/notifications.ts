// Notification service for OxyFlow
// Handles sending SMS and email notifications

/**
 * Send an SMS notification to a phone number
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns Promise that resolves when the message is sent
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // This is a placeholder implementation
    // In a production environment, you would integrate with an SMS service like Twilio
    // Example Twilio implementation:
    // const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    // const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    // const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    // 
    // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
    //   },
    //   body: new URLSearchParams({
    //     To: phoneNumber,
    //     From: fromNumber,
    //     Body: message
    //   })
    // });
    // 
    // const result = await response.json();
    // return response.ok;
    
    // For now, just log the message
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Send an email notification
 * @param email The recipient's email address
 * @param subject The email subject
 * @param body The email body
 * @returns Promise that resolves when the email is sent
 */
export async function sendEmail(email: string, subject: string, body: string): Promise<boolean> {
  try {
    // This is a placeholder implementation
    // In a production environment, you would integrate with an email service like SendGrid
    // Example SendGrid implementation:
    // const apiKey = Deno.env.get('SENDGRID_API_KEY');
    // const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL');
    // 
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{
    //       to: [{ email }]
    //     }],
    //     from: { email: fromEmail },
    //     subject,
    //     content: [{
    //       type: 'text/plain',
    //       value: body
    //     }]
    //   })
    // });
    // 
    // return response.ok;
    
    // For now, just log the message
    console.log(`[Email] To: ${email}, Subject: ${subject}, Body: ${body}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a notification about an overdue loan
 * @param phoneNumber The borrower's phone number
 * @param email The borrower's email address (optional)
 * @param borrowerName The borrower's name
 * @param cylinderCode The cylinder's label code
 * @param daysOverdue Number of days the loan is overdue
 * @returns Promise that resolves when notifications are sent
 */
export async function sendOverdueNotification(
  phoneNumber: string,
  email: string | null,
  borrowerName: string,
  cylinderCode: string,
  daysOverdue: number
): Promise<void> {
  const smsMessage = `Hello ${borrowerName}, your oxygen cylinder (${cylinderCode}) is ${daysOverdue} day(s) overdue. Please return it as soon as possible.`;
  await sendSMS(phoneNumber, smsMessage);
  
  if (email) {
    const emailSubject = `Overdue Oxygen Cylinder Return - ${cylinderCode}`;
    const emailBody = `Dear ${borrowerName},\n\nOur records show that your oxygen cylinder (${cylinderCode}) is ${daysOverdue} day(s) overdue.\n\nPlease return it to the warehouse as soon as possible.\n\nThank you,\nOxyFlow Team`;
    await sendEmail(email, emailSubject, emailBody);
  }
}

/**
 * Send a notification about a cylinder needing maintenance
 * @param staffEmail The staff member's email address
 * @param cylinderCode The cylinder's label code
 * @param warehouseName The warehouse name
 * @param daysSinceLastMaintenance Days since last maintenance (or null if never maintained)
 * @returns Promise that resolves when the notification is sent
 */
export async function sendMaintenanceNotification(
  staffEmail: string,
  cylinderCode: string,
  warehouseName: string,
  daysSinceLastMaintenance: number | null
): Promise<void> {
  const maintenanceStatus = daysSinceLastMaintenance 
    ? `${daysSinceLastMaintenance} days since last maintenance` 
    : 'never been maintained';
  
  const emailSubject = `Cylinder Maintenance Required - ${cylinderCode}`;
  const emailBody = `Cylinder ${cylinderCode} at ${warehouseName} warehouse requires maintenance.\n\nMaintenance status: ${maintenanceStatus}.\n\nPlease schedule maintenance as soon as possible.\n\nThank you,\nOxyFlow System`;
  
  await sendEmail(staffEmail, emailSubject, emailBody);
}