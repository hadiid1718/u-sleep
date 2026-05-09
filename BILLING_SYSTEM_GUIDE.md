# Billing Management System - Integration Guide

## Overview
This document describes the new billing management system with payment flow pages, admin subscription management, and user subscription dashboard.

## New Pages Created

### 1. Payment Success Page
**File:** `Frontend/src/pages/Billing/PaymentSuccessPage.jsx`

Shows confirmation after successful payment. Includes:
- Success icon and title
- Session ID display
- Next steps information
- Action buttons (Dashboard, Billing)
- Admin approval notification

**Route to add:**
```jsx
<Route path="/payment/success" element={<PaymentSuccessPage />} />
```

### 2. Payment Cancel Page
**File:** `Frontend/src/pages/Billing/PaymentCancelPage.jsx`

Shows information when payment is cancelled. Includes:
- Cancel icon and title
- Reasons for cancellation
- Next steps
- Action buttons (Try Again, Dashboard)
- Support contact info

**Route to add:**
```jsx
<Route path="/payment/cancel" element={<PaymentCancelPage />} />
```

## New Components

### 1. Admin Subscription Management Tab
**File:** `Frontend/src/components/admin/AdminSubscriptionTab.jsx`

Allows admins to:
- View pending subscription approvals
- Approve/decline subscription requests
- View active subscriptions
- Manage refund requests (approve/decline)

**Features:**
- Tabbed interface (Pending, Active, Refunds)
- Modals for approval/decline actions
- Real-time status display
- Reason fields for declinations

**Integration:**
```jsx
import AdminSubscriptionTab from '../../components/admin/AdminSubscriptionTab';

// In admin dashboard
<AdminSubscriptionTab />
```

### 2. User Subscription Dashboard
**File:** `Frontend/src/pages/user/UserSubscriptionTab.jsx`

Displays user subscription information with:
- Active plan status cards (4 cards showing plan, status, days remaining, price)
- Proposal usage bar with percentage
- Daily proposals chart (Line chart)
- Usage by category (Pie chart)
- Platform distribution (Bar chart)
- Available features list
- Refund request button
- Decline plan button

**Features:**
- Real-time analytics
- Usage tracking
- Refund request modal with validation
- Plan decline confirmation modal
- 5-day refund window validation

**Integration:**
```jsx
import UserSubscriptionTab from '../../pages/user/UserSubscriptionTab';

// In user dashboard
<UserSubscriptionTab />
```

## Backend Models

### 1. RefundRequest Model
**File:** `backend/src/models/refundRequest.model.js`

Fields:
```javascript
{
  userId,           // Reference to User
  subscriptionId,   // Reference to Subscription
  amount,           // Refund amount
  planName,         // Plan name
  reason,           // User's reason
  status,           // pending, approved, declined, refunded
  daysSincePurchase,
  purchaseDate,
  declinedReason,
  processedAt,
  refundedAt,
  stripeRefundId,
  timestamps
}
```

### 2. Updated Subscription Model
**File:** `backend/src/models/subscription.model.js`

New fields added:
```javascript
{
  status: [
    'pending_approval',  // New - waiting for admin approval
    'declined',          // New - admin declined
    'declined_by_user',  // New - user declined
    'cancelled',         // New - subscription cancelled
    // ... existing statuses
  ],
  adminApprovedAt,       // When admin approved
  adminApprovedBy,       // Admin who approved
  activatedAt,           // When subscription became active
  declinedAt,            // When declined
  declinedReason,        // Reason for decline
  declinedBy,            // Admin who declined
  declinedByUserAt,      // When user declined
  cancelledAt,           // When cancelled
  nextBillingDate        // Next billing date
}
```

## Backend Controllers

### 1. Admin Subscription Controller
**File:** `backend/src/controller/admin.subscription.controller.js`

Endpoints:
- `GET /admin/subscriptions` - Get all subscriptions with filters
- `POST /admin/subscriptions/:id/approve` - Approve subscription
- `POST /admin/subscriptions/:id/decline` - Decline subscription
- `GET /admin/refund-requests` - Get refund requests
- `POST /admin/refund-requests/:id/approve` - Approve refund
- `POST /admin/refund-requests/:id/decline` - Decline refund

### 2. User Subscription Controller
**File:** `backend/src/controller/user.subscription.controller.js`

Endpoints:
- `GET /user/subscription/usage` - Get usage data
- `GET /user/subscription/analytics` - Get analytics data
- `POST /user/refund-request` - Create refund request
- `GET /user/refund-requests` - Get user's refund requests
- `POST /user/subscription/decline` - Decline plan

## Backend Routes

### 1. Admin Subscription Routes
**File:** `backend/src/routes/admin.subscription.router.js`

```javascript
POST   /api/v1/admin/subscriptions
POST   /api/v1/admin/subscriptions/:id/approve
POST   /api/v1/admin/subscriptions/:id/decline
POST   /api/v1/admin/refund-requests
POST   /api/v1/admin/refund-requests/:id/approve
POST   /api/v1/admin/refund-requests/:id/decline
```

### 2. User Subscription Routes
**File:** `backend/src/routes/user.subscription.router.js`

```javascript
GET    /api/v1/user/subscription/usage
GET    /api/v1/user/subscription/analytics
POST   /api/v1/user/refund-request
GET    /api/v1/user/refund-requests
POST   /api/v1/user/subscription/decline
```

## Integration Steps

### Step 1: Update Billing Controller
Modify the checkout session to redirect to success/cancel pages:

```javascript
// In createCheckoutSession
const session = await stripe.checkout.sessions.create({
  // ... existing config
  success_url: `${CLIENT_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${CLIENT_APP_URL}/payment/cancel`,
});
```

### Step 2: Update Stripe Webhook
In the webhook handler, set subscription status to `pending_approval`:

```javascript
if (event.type === 'checkout.session.completed') {
  // Create subscription with status: 'pending_approval'
  await Subscription.create({
    userId,
    status: 'pending_approval',  // Not 'active' yet
    // ... other fields
  });
}
```

### Step 3: Add Routes to Frontend
```jsx
// In your main router (App.jsx or similar)
<Route path="/payment/success" element={<PaymentSuccessPage />} />
<Route path="/payment/cancel" element={<PaymentCancelPage />} />
```

### Step 4: Add Routes to Backend App
Routes are already registered in `app.js`:
```javascript
app.use('/api/v1/admin/subscriptions', adminSubscriptionRouter);
app.use('/api/v1/user', userSubscriptionRouter);
```

### Step 5: Add to Admin Dashboard
Integrate the AdminSubscriptionTab in your admin panel:

```jsx
import AdminSubscriptionTab from '../../components/admin/AdminSubscriptionTab';

// In admin dashboard component
<div>
  <h2>Subscription Management</h2>
  <AdminSubscriptionTab />
</div>
```

### Step 6: Add to User Dashboard
Integrate the UserSubscriptionTab in user dashboard:

```jsx
import UserSubscriptionTab from '../../pages/user/UserSubscriptionTab';

// In user dashboard/subscription tab
<UserSubscriptionTab />
```

## Workflow

### User Subscription Flow
1. User selects plan and pays via Stripe
2. Payment successful → redirects to `/payment/success`
3. Subscription created with status `pending_approval`
4. Admin reviews in Admin Dashboard → Subscription Management tab
5. Admin approves or declines
6. User notified and gains/loses access
7. If approved, user can request refund within 5 days
8. User can also decline the plan anytime

### Refund Request Flow
1. User requests refund (within 5 days of activation)
2. Refund request created with status `pending`
3. Admin reviews in Admin Dashboard → Refund Requests tab
4. Admin approves or declines
5. If approved, Stripe refund processed
6. User receives confirmation notification

## API Response Examples

### Approve Subscription
```bash
POST /api/v1/admin/subscriptions/{id}/approve
Content-Type: application/json

{
  "userId": "user123"
}

Response:
{
  "success": true,
  "message": "Subscription approved",
  "subscription": {
    "_id": "sub123",
    "userId": "user123",
    "plan": "pro",
    "status": "active",
    "adminApprovedAt": "2024-05-08T10:30:00Z",
    "activatedAt": "2024-05-08T10:30:00Z"
  }
}
```

### Create Refund Request
```bash
POST /api/v1/user/refund-request
Content-Type: application/json

{
  "subscriptionId": "sub123",
  "reason": "Not meeting my needs"
}

Response:
{
  "success": true,
  "message": "Refund request submitted",
  "refundRequest": {
    "_id": "refund123",
    "userId": "user123",
    "subscriptionId": "sub123",
    "amount": 29.99,
    "planName": "pro",
    "status": "pending",
    "daysSincePurchase": 2
  }
}
```

## Notes

- Refund requests are only valid within 5 days of admin approval
- Subscription status changes trigger notifications
- All admin actions are logged with admin ID and timestamp
- Stripe refunds are processed through the Refund API
- Analytics data is real-time and connected to usage records

## Future Enhancements

- Email notifications for approval/decline
- Subscription history/audit trail
- Custom analytics dashboard
- Bulk actions for admins
- Subscription upgrade/downgrade options
- Trial periods
- Coupon/discount support
