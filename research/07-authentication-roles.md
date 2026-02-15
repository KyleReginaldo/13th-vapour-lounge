# Authentication & Role-Based Access Control

## Research Overview

Comprehensive authentication strategy for Vapour Lounge with three distinct user roles: Admin, Staff, and Customer.

---

## 1. Authentication Requirements

### Three-Role System

**Admin**

- Full system access
- Manage staff accounts
- Configure system settings
- View all audit logs
- Override permissions

**Staff**

- POS operations
- Limited inventory management
- Order processing
- Cannot change prices (unless granted)
- Cannot delete critical records

**Customer**

- Browse and purchase
- Track orders
- Leave reviews
- Manage profile and addresses

---

## 2. Supabase Auth Architecture

### 2.1 User Table Structure

```sql
-- Built-in Supabase auth.users table
-- Columns: id, email, encrypted_password, email_confirmed_at, etc.

-- Custom profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer-specific data
CREATE TABLE customer_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  date_of_birth DATE,
  age_verified BOOLEAN DEFAULT FALSE,
  id_verification_url TEXT, -- Uploaded ID image
  id_verified_at TIMESTAMPTZ,
  id_verified_by UUID REFERENCES profiles(id),
  consent_timestamp TIMESTAMPTZ, -- Terms & conditions
  newsletter_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff-specific data
CREATE TABLE staff_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  hire_date DATE NOT NULL,
  position TEXT,
  hourly_rate DECIMAL(10, 2),
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff permissions example
-- {
--   "can_edit_prices": false,
--   "can_delete_products": false,
--   "can_process_refunds": true,
--   "can_view_reports": true,
--   "can_manage_inventory": true
-- }
```

### 2.2 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own, admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customer profiles: Own or admin
CREATE POLICY "Customers can view own data"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all customer data"
  ON customer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff profiles: Admins only
CREATE POLICY "Admins can manage staff"
  ON staff_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Staff can view own data"
  ON staff_profiles FOR SELECT
  USING (auth.uid() = id);
```

---

## 3. Authentication Flows

### 3.1 Customer Registration

```
[Registration Page]
      ↓
[Email + Password]
      ↓
[Supabase signUp()]
      ↓
[Confirmation email sent]
      ↓
[User clicks link]
      ↓
[Email verified]
      ↓
[Create profile record role='customer']
      ↓
[Redirect to age verification]
      ↓
[Upload ID / Enter DOB]
      ↓
[Pending admin approval]
      ↓
[Approved: Full access]
```

**Code Example:**

```typescript
// app/actions/users.ts
"use server";

export async function signUpCustomer(formData: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  const supabase = await createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
      },
    },
  });

  if (authError) throw authError;

  // 2. Create profile (via database trigger or manually)
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user!.id,
    email: formData.email,
    full_name: formData.fullName,
    phone: formData.phone,
    role: "customer",
  });

  if (profileError) throw profileError;

  // 3. Create customer profile
  const { error: customerError } = await supabase
    .from("customer_profiles")
    .insert({
      id: authData.user!.id,
      age_verified: false,
    });

  if (customerError) throw customerError;

  return { success: true, message: "Check your email to confirm your account" };
}
```

### 3.2 Staff/Admin Creation

**Admin creates staff account:**

```
[Admin Panel → Staff Management]
      ↓
[Create Staff Form]
  - Email
  - Full Name
  - Employee ID
  - Position
  - Hourly Rate
  - Permissions
      ↓
[Send invitation email]
      ↓
[Staff clicks link]
      ↓
[Set password]
      ↓
[Account activated]
      ↓
[Login with staff portal]
```

**Code Example:**

```typescript
// app/actions/staff.ts
"use server";

export async function createStaffAccount(formData: {
  email: string;
  fullName: string;
  employeeId: string;
  position: string;
  hourlyRate: number;
  permissions: Record<string, boolean>;
}) {
  const supabase = await createClient();

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin only");
  }

  // Generate temporary password
  const tempPassword = generateSecurePassword();

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: formData.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm for staff
      user_metadata: {
        full_name: formData.fullName,
        role: "staff",
      },
    });

  if (authError) throw authError;

  // Create profile
  await supabase.from("profiles").insert({
    id: authData.user.id,
    email: formData.email,
    full_name: formData.fullName,
    role: "staff",
  });

  // Create staff profile
  await supabase.from("staff_profiles").insert({
    id: authData.user.id,
    employee_id: formData.employeeId,
    position: formData.position,
    hourly_rate: formData.hourlyRate,
    permissions: formData.permissions,
    hire_date: new Date().toISOString().split("T")[0],
  });

  // Send invitation email
  await sendStaffInvitationEmail(formData.email, tempPassword);

  return { success: true };
}
```

### 3.3 Login Flow with Role-Based Redirect

```typescript
// app/actions/users.ts
"use server";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  // Redirect based on role
  let redirectUrl = "/";
  switch (profile?.role) {
    case "admin":
      redirectUrl = "/admin";
      break;
    case "staff":
      redirectUrl = "/admin/pos"; // Staff starts at POS
      break;
    case "customer":
      redirectUrl = "/";
      break;
  }

  return { success: true, redirectUrl, role: profile?.role };
}
```

---

## 4. Session Management

### 4.1 Force Logout (Admin Feature)

```sql
-- Add session tracking table
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);
```

```typescript
// app/actions/users.ts
"use server";

export async function forceLogoutUser(userId: string) {
  const supabase = await createServiceRoleClient(); // Service role bypass RLS

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Revoke all sessions
  await supabase
    .from("active_sessions")
    .update({ revoked: true })
    .eq("user_id", userId);

  // Log audit
  await logAudit({
    action: "FORCE_LOGOUT",
    userId: user!.id,
    targetUserId: userId,
    metadata: { reason: "Admin action" },
  });

  return { success: true };
}

// Middleware to check session validity
export async function validateSession(sessionToken: string) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("active_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .eq("revoked", false)
    .single();

  if (!session) {
    // Session revoked or invalid
    throw new Error("Session invalid");
  }

  // Update last activity
  await supabase
    .from("active_sessions")
    .update({ last_activity: new Date().toISOString() })
    .eq("id", session.id);

  return session;
}
```

### 4.2 Automatic Session Expiry

```typescript
// lib/auth/session.ts
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export async function checkSessionExpiry() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return false;

  const sessionAge = Date.now() - new Date(session.expires_at || 0).getTime();

  if (sessionAge > SESSION_TIMEOUT) {
    await supabase.auth.signOut();
    return false;
  }

  return true;
}

// Use in middleware
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const isValid = await checkSessionExpiry();
    if (!isValid) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return response;
}
```

---

## 5. Password Management

### 5.1 Password Requirements

```typescript
// lib/validations/auth.ts
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character"
  );

export const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

### 5.2 Password Reset Flow with Email Confirmation

```typescript
// app/actions/users.ts
"use server";

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  // Send reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) throw error;

  // Log attempt
  await logAudit({
    action: "PASSWORD_RESET_REQUESTED",
    metadata: { email },
  });

  return {
    success: true,
    message: "If an account exists, you will receive a password reset email",
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const supabase = await createClient();

  // Validate password
  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  // Update password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  // Log successful reset
  await logAudit({
    action: "PASSWORD_RESET_COMPLETED",
    userId: data.user.id,
  });

  return { success: true, message: "Password updated successfully" };
}
```

---

## 6. Age Verification (ID Upload)

### 6.1 Upload Flow

```typescript
// app/actions/users.ts
"use server";

export async function uploadIdVerification(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Upload to Supabase Storage
  const fileName = `${user.id}/${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("id-verifications")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("id-verifications").getPublicUrl(fileName);

  // Update customer profile
  const { error: updateError } = await supabase
    .from("customer_profiles")
    .update({
      id_verification_url: publicUrl,
      age_verified: false, // Pending admin approval
    })
    .eq("id", user.id);

  if (updateError) throw updateError;

  // Notify admins
  await notifyAdminsNewIdVerification(user.id);

  return { success: true, message: "ID uploaded. Awaiting verification." };
}

export async function approveIdVerification(
  customerId: string,
  approved: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify caller is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Update verification status
  const { error } = await supabase
    .from("customer_profiles")
    .update({
      age_verified: approved,
      id_verified_at: approved ? new Date().toISOString() : null,
      id_verified_by: approved ? user!.id : null,
    })
    .eq("id", customerId);

  if (error) throw error;

  // Log audit
  await logAudit({
    action: approved ? "ID_APPROVED" : "ID_REJECTED",
    userId: user!.id,
    targetUserId: customerId,
  });

  // Send email to customer
  if (approved) {
    await sendEmail({
      to: customerId,
      template: "age-verification-approved",
    });
  } else {
    await sendEmail({
      to: customerId,
      template: "age-verification-rejected",
    });
  }

  return { success: true };
}
```

### 6.2 Age Gate for Browse

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public pages that don't require age verification
  const publicPaths = [
    "/sign-in",
    "/sign-up",
    "/age-gate",
    "/about",
    "/contact",
  ];
  if (publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (user) {
    // Check if age verified
    const { data: customer } = await supabase
      .from("customer_profiles")
      .select("age_verified")
      .eq("id", user.id)
      .single();

    if (
      !customer?.age_verified &&
      request.nextUrl.pathname.startsWith("/shop")
    ) {
      return NextResponse.redirect(new URL("/age-verification", request.url));
    }
  }

  return NextResponse.next();
}
```

---

## 7. Role-Based UI Components

### 7.1 Permission Hook

```typescript
// hooks/usePermissions.ts
import { useUser } from "@/hooks/useUser";

export function usePermissions() {
  const { user, profile, staffProfile } = useUser();

  const hasPermission = (permission: string): boolean => {
    if (!user || !profile) return false;

    // Admins have all permissions
    if (profile.role === "admin") return true;

    // Staff check specific permissions
    if (profile.role === "staff" && staffProfile) {
      return staffProfile.permissions?.[permission] === true;
    }

    return false;
  };

  const isRole = (role: "admin" | "staff" | "customer"): boolean => {
    return profile?.role === role;
  };

  return {
    hasPermission,
    isRole,
    isAdmin: isRole("admin"),
    isStaff: isRole("staff"),
    isCustomer: isRole("customer"),
  };
}
```

### 7.2 Protected Component

```typescript
// components/PermissionGate.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { ReactNode } from 'react'

interface PermissionGateProps {
  permission?: string
  role?: 'admin' | 'staff' | 'customer'
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permission,
  role,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, isRole } = usePermissions()

  const hasAccess = permission
    ? hasPermission(permission)
    : role
    ? isRole(role)
    : true

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage:
<PermissionGate permission="can_edit_prices">
  <Button onClick={handleEditPrice}>Edit Price</Button>
</PermissionGate>

<PermissionGate role="admin" fallback={<div>Admin only</div>}>
  <AdminDashboard />
</PermissionGate>
```

---

## 8. Audit Logging for Auth Events

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

```typescript
// lib/auth/audit.ts
export async function logAudit(params: {
  action: string;
  userId?: string;
  targetUserId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    action: params.action,
    user_id: params.userId,
    target_user_id: params.targetUserId,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });

  if (error) {
    console.error("Audit log failed:", error);
  }
}

// Actions to log:
// - LOGIN
// - LOGOUT
// - SIGNUP
// - PASSWORD_RESET_REQUESTED
// - PASSWORD_RESET_COMPLETED
// - PASSWORD_CHANGED
// - EMAIL_CHANGED
// - ROLE_CHANGED
// - STAFF_CREATED
// - STAFF_DEACTIVATED
// - FORCE_LOGOUT
// - ID_UPLOADED
// - ID_APPROVED
// - ID_REJECTED
// - PERMISSION_CHANGED
```

---

## 9. Social Login (Optional)

### 9.1 Google OAuth

```typescript
// app/actions/users.ts
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;

  return data;
}

// Callback handler
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if profile exists, create if not
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Create profile for OAuth user
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || "",
          role: "customer",
          avatar_url: user.user_metadata.avatar_url,
        });

        // Create customer profile
        await supabase.from("customer_profiles").insert({
          id: user.id,
        });
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

---

## 10. Best Practices Summary

### Security

✓ Use Row Level Security (RLS) on all tables
✓ Never expose service role key to client
✓ Validate all inputs server-side
✓ Hash sensitive data at rest
✓ Use HTTPS only
✓ Implement rate limiting on auth endpoints
✓ Log all authentication events

### User Experience

✓ Clear error messages (without exposing security details)
✓ Loading states during auth operations
✓ Remember me functionality
✓ Password strength indicator
✓ Email verification reminder
✓ Session timeout warning

### Compliance

✓ Age verification before purchase
✓ Store consent timestamps
✓ GDPR-compliant data handling
✓ Allow users to export their data
✓ Right to be forgotten implementation

### Code Organization

✓ Centralize auth logic in server actions
✓ Reusable permission hooks
✓ Consistent error handling
✓ Type-safe with TypeScript
✓ Separate concerns (auth, profiles, permissions)

---

## Next Steps

1. Implement basic Supabase auth setup
2. Create user tables with RLS
3. Build login/signup forms
4. Add role-based routing
5. Implement permission system
6. Add audit logging
7. Test all auth flows
8. Security audit

---

## Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Next.js Auth Patterns: https://nextjs.org/docs/authentication
- OWASP Auth Cheatsheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
