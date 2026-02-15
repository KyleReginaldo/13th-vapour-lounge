# Vapour Lounge - Quick Start Guide

## Setup Instructions

### 1. Environment Setup

Ensure your `.env.local` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the SQL to disable RLS (already done):

```sql
-- All tables have RLS disabled
```

Seed the database:

```bash
npm run seed
```

This creates:

- ✅ 3 roles: admin, staff, customer
- ✅ Shop settings with default categories
- ✅ Cash register

### 3. Start Development Server

```bash
npm run dev
```

### 4. Create Your Account

1. Visit: `http://localhost:3000/sign-up`
2. Fill in the form and create your account
3. You'll be redirected to sign-in

### 5. Promote Yourself to Admin

Visit: `http://localhost:3000/promote-admin?email=your-email@example.com`

Or use the SQL:

```sql
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'your-email@example.com';
```

### 6. Access Admin Panel

Visit: `http://localhost:3000/admin`

You should see:

- ✅ Dashboard with stats
- ✅ Sidebar navigation
- ✅ Your name in header
- ✅ Sign out button

## Available Routes

### Public

- `/` - Home page
- `/sign-up` - User registration
- `/sign-in` - User login

### Protected (Requires Auth)

- `/admin` - Admin dashboard (admin/staff only)
- `/admin/products` - Product management
- `/admin/inventory` - Inventory tracking
- `/admin/orders` - Order management

### Utility

- `/seed` - Database seeding page
- `/promote-admin` - User role management
- `/unauthorized` - Access denied page

## Next Steps

✅ **Phase 1 Complete!**

- Supabase Auth integrated
- Sign in/Sign up pages
- Admin layout with role protection
- Dashboard with live stats

**Ready for Phase 2: Product Management**

- Product listing page
- Product form
- Category management
- Image uploads

## Troubleshooting

### Can't access admin panel?

1. Check you've promoted yourself to admin
2. Try signing out and back in
3. Check browser console for errors

### Seed errors?

Make sure RLS is disabled on all tables:

```sql
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

### Auth not working?

1. Check env variables are set
2. Verify Supabase project URL and key
3. Check Supabase Auth is enabled in dashboard

## Support

Check these files for configuration:

- `lib/auth/supabase-auth.ts` - Auth logic
- `middleware.ts` - Route protection
- `app/(admin)/admin/layout.tsx` - Admin layout
