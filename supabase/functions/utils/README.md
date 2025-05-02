# OxyFlow Notification Service

This directory contains utilities for sending notifications from Supabase Edge Functions.

## Overview

The notification service provides functionality to send SMS and email notifications for:

- Overdue cylinder loans
- Cylinders requiring maintenance

## Files

- `notifications.ts` - Core notification service with functions for sending SMS and emails

## Usage

```typescript
import { sendOverdueNotification, sendMaintenanceNotification } from './utils/notifications.ts';

// Send overdue notification
await sendOverdueNotification(
  '+1234567890',           // Phone number
  'borrower@example.com',  // Email (optional, can be null)
  'John Doe',              // Borrower name
  'CYL-123',               // Cylinder code
  3                        // Days overdue
);

// Send maintenance notification
await sendMaintenanceNotification(
  'staff@example.com',     // Staff email
  'CYL-123',               // Cylinder code
  'Main Warehouse',        // Warehouse name
  90                       // Days since last maintenance (or null if never maintained)
);
```

## Production Setup

For production use, you'll need to:

1. Uncomment and configure the SMS service (e.g., Twilio) in `notifications.ts`
2. Uncomment and configure the email service (e.g., SendGrid) in `notifications.ts`
3. Add the following environment variables to your Supabase project:

### For Twilio SMS:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### For SendGrid Email:
```
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## Integration with cronOverdue.ts

The notification service is integrated with the `cronOverdue.ts` Edge Function to automatically send notifications for overdue loans and cylinders needing maintenance.