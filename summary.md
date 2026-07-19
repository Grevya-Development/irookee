# Irookee Platform - Comprehensive Overview

## Executive Summary

**Irookee** is a modern peer-to-peer expertise marketplace platform that connects users with verified experts across various domains for one-on-one consultation sessions. The platform leverages AI-powered matching, secure payment processing, and a commission-based business model to facilitate knowledge sharing and professional services.

**Platform Tagline**: "People for People" - Connecting exceptional experts with amazing opportunities worldwide.

---

## 1. Platform Architecture

### 1.1 Technology Stack

#### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.1
- **Routing**: React Router DOM 6.26.2
- **UI Library**: 
  - shadcn-ui components (Radix UI primitives)
  - Tailwind CSS 3.4.11 for styling
  - Lucide React for icons
- **State Management**: 
  - React Query (TanStack Query) 5.56.2 for server state
  - React Context API for auth state
- **Form Handling**: React Hook Form 7.53.0 with Zod validation
- **Payment Integration**: Stripe.js 2.4.0 (@stripe/stripe-js, @stripe/react-stripe-js)
- **Animations**: Framer Motion 12.2.0
- **Date Handling**: date-fns 3.6.0, react-day-picker 8.10.1

#### Backend
- **Database**: PostgreSQL (via Supabase)
- **Backend-as-a-Service**: Supabase
  - Authentication (Supabase Auth)
  - Database (PostgreSQL with Row Level Security)
  - Edge Functions (Deno runtime)
  - Storage (for file uploads)
- **AI Integration**: Groq API (Llama 3.3 70B model)
- **Payment Processing**: Stripe

#### Development Tools
- **Linting**: ESLint 9.9.0
- **Type Checking**: TypeScript 5.5.3
- **Package Manager**: npm

### 1.2 Project Structure

```
talktalent-finder-main/
├── src/
│   ├── components/
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ExpertApproval.tsx
│   │   │   ├── PaymentTracking.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── booking/           # Booking flow components
│   │   │   ├── BookingCalendar.tsx
│   │   │   ├── BookingConfirmation.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── expert/           # Expert-specific components
│   │   │   ├── AvailabilityManager.tsx
│   │   │   ├── ExpertCard.tsx
│   │   │   ├── ExpertDashboard.tsx
│   │   │   └── ExpertOnboarding.tsx
│   │   ├── gamification/     # Gamification features
│   │   │   ├── BadgeSystem.tsx
│   │   │   ├── LoyaltyPoints.tsx
│   │   │   └── ReferralRewards.tsx
│   │   ├── sections/         # Page sections
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   └── TestimonialsSection.tsx
│   │   ├── ui/               # shadcn-ui components (49 components)
│   │   ├── AuthProvider.tsx
│   │   ├── BookingModal.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── Chat.tsx
│   │   ├── ExpertCard.tsx
│   │   ├── ExpertGrid.tsx
│   │   ├── GuestProfileForm.tsx
│   │   ├── IntelligentSearch.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProfileSetup.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SpeakerCard.tsx (legacy, being migrated to ExpertCard)
│   │   ├── SpeakerGrid.tsx (legacy, being migrated to ExpertGrid)
│   │   └── UserDashboard.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAISearch.ts
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   └── useExperts.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/                  # Utilities and API clients
│   │   ├── adminApi.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── groq.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/                # Page components
│   │   ├── About.tsx
│   │   ├── Admin.tsx
│   │   ├── Auth.tsx
│   │   ├── Blog.tsx
│   │   ├── Booking.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExpertProfile.tsx
│   │   ├── GuestProfile.tsx
│   │   ├── Home.tsx
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   ├── PromptPeople.tsx (landing page)
│   │   ├── Search.tsx
│   │   ├── Speakers.tsx (Experts listing page)
│   │   └── Team.tsx
│   ├── types/                # TypeScript type definitions
│   │   ├── message.ts
│   │   ├── promptpeople.ts
│   │   └── speaker.ts (being migrated to expert terminology)
│   ├── App.tsx               # Main app component with routing
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── chat/
│   │   │   └── index.ts
│   │   ├── create-booking/
│   │   │   └── index.ts
│   │   ├── search/
│   │   │   └── index.ts
│   │   └── search-experts/
│   │       └── index.ts
│   ├── migrations/           # Database migrations
│   │   ├── 20250120000000_expertise_marketplace_schema.sql
│   │   ├── 20250812182531_1bd0c7d7-0352-4825-a736-938772171075.sql
│   │   ├── 20250813070359_cdd64081-61b8-4d42-98dc-0f827bdbb5af.sql
│   │   ├── 20250813070945_e74f6d89-47df-4e8d-a170-5d30221efb1e.sql
│   │   ├── 20250917055318_5d70a386-5cca-4a6c-9b0e-410ff73e630b.sql
│   │   └── 20250921102746_b90ecc85-76ac-432c-b230-dd48ef6c28cf.sql
│   └── config.toml
├── public/                   # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 2. Core Features

### 2.1 User Management & Authentication

#### User Types
- **Consumers**: Users seeking expert services
- **Experts**: Verified professionals offering services
- **Both**: Users who can both consume and provide services
- **Admins**: Platform administrators with full access
- **Moderators**: Users with moderation capabilities

#### Authentication Flow
1. **Sign Up**: Email/password registration with email verification
2. **Sign In**: Email/password authentication
3. **Guest Mode**: Browse without authentication
4. **Session Management**: Automatic session handling via Supabase Auth
5. **Role-Based Access**: Admin, moderator, and user roles with RLS policies

#### Profile Management
- User profiles stored in `profiles` table
- Expert profiles in `expert_profiles` table
- Profile fields: full_name, avatar_url, bio, phone, user_type
- Automatic profile creation on user registration
- Profile updates with validation

### 2.2 Expert Management

#### Expert Onboarding
- Multi-step onboarding process (`ExpertOnboarding.tsx`)
- Required fields:
  - Title/Professional designation
  - Expertise areas (array)
  - Years of experience
  - Hourly rate
  - Location
  - Languages spoken
  - Bio (optional)
- Verification status: `pending` → `verified` → `rejected`
- Admin approval required before going live

#### Expert Profiles
- Comprehensive profile display
- Rating system (0-5 stars, calculated from reviews)
- Total sessions count
- Verification badges
- Expertise areas tags
- Availability calendar
- Social links (LinkedIn, Twitter, Website)
- Video introduction support
- Travel preferences
- Speaking fees (virtual vs in-person)

#### Expert Dashboard
- Booking management
- Availability scheduling
- Earnings tracking
- Review management
- Profile editing
- Performance analytics

### 2.3 AI-Powered Search & Matching

#### Intelligent Search System
- **Primary**: Groq API integration (Llama 3.3 70B model)
- **Fallback**: Enhanced database search with text matching
- **Features**:
  - Natural language query processing
  - Expertise area extraction
  - Professional type detection
  - Location preference matching
  - Experience level filtering
  - Price range consideration
  - Match score calculation (0-100)

#### Search Flow
1. User enters natural language query
2. Groq API analyzes query and extracts:
   - Relevant expertise areas
   - Professional type
   - Location preferences
   - Experience level
   - Price range
   - Search terms
3. Database query with extracted parameters
4. Match score calculation for each expert
5. Results sorted by relevance
6. Fallback to database search if AI fails

#### Search Components
- `IntelligentSearch.tsx`: Main search component
- `SearchBar.tsx`: AI-powered search bar
- `useAISearch.ts`: Custom hook for search functionality
- `search-experts` Edge Function: Backend search processing

### 2.4 Booking System

#### Booking Flow
1. **Expert Selection**: User selects expert from search results
2. **Schedule Selection**: Choose date/time from expert availability
3. **Duration Selection**: Select session duration (default 60 minutes)
4. **Payment Processing**: Stripe payment intent creation
5. **Booking Confirmation**: Booking record created with status `pending`
6. **Payment Completion**: Stripe webhook updates booking status
7. **Session Management**: Meeting link generation, status updates

#### Booking States
- `pending`: Awaiting payment
- `confirmed`: Payment received, session scheduled
- `completed`: Session finished
- `cancelled`: Booking cancelled
- `refunded`: Payment refunded

#### Payment Processing
- **Provider**: Stripe
- **Commission Model**: Platform takes default 15% commission
- **Calculation**:
  - Session Cost = Hourly Rate × (Duration Minutes / 60)
  - Platform Fee = Session Cost × Commission Rate
  - Expert Payout = Session Cost - Platform Fee
- **Payment Intent**: Created via Stripe API
- **Webhook Handling**: Status updates on payment completion

#### Booking Components
- `BookingModal.tsx`: Quick booking modal
- `BookingCalendar.tsx`: Availability calendar
- `BookingConfirmation.tsx`: Confirmation page
- `PaymentForm.tsx`: Stripe payment form
- `create-booking` Edge Function: Booking creation and payment processing

### 2.5 Review & Rating System

#### Review Features
- Post-session reviews (1-5 stars)
- Written comments
- One review per booking
- Public display on expert profiles
- Automatic rating calculation (average of all reviews)
- Review moderation capabilities

#### Rating Calculation
- Triggered automatically on review creation
- Updates expert's average rating
- Updates total sessions count
- Database trigger: `update_expert_rating()`

### 2.6 Availability Management

#### Availability Types
- **Recurring**: Weekly recurring slots (day of week + time range)
- **One-time**: Specific date/time slots
- **Status**: Available, Tentative, Unavailable

#### Availability Features
- Calendar view
- Time slot selection
- Timezone support
- Conflict detection
- Bulk availability setting

### 2.7 Messaging System

#### Chat Features
- Booking-based messaging
- Real-time message delivery
- Read/unread status
- Message history
- Participant verification (consumer + expert only)

### 2.8 Gamification (Planned/Partial Implementation)

#### Features
- **Badge System**: Achievement badges for experts
- **Loyalty Points**: Points for completed sessions
- **Referral Rewards**: Rewards for referring new users

### 2.9 Admin Dashboard

#### Admin Features
- **Expert Approval**: Review and approve/reject expert profiles
- **User Management**: View and manage all users
- **Payment Tracking**: Monitor transactions and payouts
- **Analytics Dashboard**: Platform metrics and insights
- **Content Moderation**: Review management

#### Admin Access
- Role-based access control
- Admin email: `nrkavin005@gmail.com` (auto-assigned)
- Protected routes with `AdminProtectedRoute`

---

## 3. Database Schema

### 3.1 Core Tables

#### `profiles`
- User profile information
- Links to `auth.users`
- Fields: id, email, full_name, avatar_url, bio, phone, user_type
- RLS: Public read, users can update own profile

#### `expert_profiles`
- Expert-specific information
- Fields: id, user_id, title, expertise_areas[], experience_years, hourly_rate, commission_rate, location, languages[], verification_status, rating, total_sessions, is_active
- RLS: Active profiles viewable by all, experts can update own profile

#### `expertise_bookings`
- Booking records
- Fields: id, consumer_id, expert_id, scheduled_at, duration_minutes, status, meeting_link, total_amount, platform_fee, expert_payout, payment_intent_id, consumer_notes, expert_notes
- RLS: Users can view/update their own bookings

#### `expertise_reviews`
- Review records
- Fields: id, booking_id, reviewer_id, expert_id, rating, comment
- RLS: Reviews viewable by all, users can review their bookings

#### `expertise_messages`
- Message records
- Fields: id, booking_id, sender_id, content, is_read
- RLS: Users can view/send messages for their bookings

#### `availability_slots`
- Expert availability
- Fields: id, expert_id, day_of_week, start_time, end_time, is_recurring
- RLS: Viewable by all, experts manage own availability

#### `expert_embeddings`
- AI search embeddings
- Fields: id, expert_id, embedding_text, last_updated
- RLS: Public read, experts manage own embeddings

### 3.2 Legacy Tables (Backward Compatibility)

#### `speakers`
- Legacy expert table (being phased out)
- Similar structure to `expert_profiles`
- Maintained for backward compatibility

#### `bookings`
- Legacy booking table
- Dual structure supporting both old and new systems

### 3.3 Supporting Tables

- `categories`: Service categories
- `speaker_categories`: Junction table (legacy)
- `user_roles`: Role assignments (admin, moderator, user)
- `guest_profiles`: Guest profile submissions
- `user_profiles`: Additional user profile data
- `topics`: Topic categorization
- `verification_requests`: Expert verification requests
- `testimonials`: Expert testimonials
- `achievements`: Expert achievements

### 3.4 Database Features

#### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce data access rules
- User-specific data access
- Public read access where appropriate

#### Indexes
- Performance indexes on foreign keys
- Composite indexes for common queries
- Indexes on verification_status, is_active, status fields

#### Triggers
- `update_expert_rating()`: Auto-updates expert ratings
- `update_updated_at_column()`: Auto-updates timestamps
- `handle_new_user()`: Creates profile on user registration

---

## 4. API & Edge Functions

### 4.1 Edge Functions

#### `search-experts`
- **Purpose**: AI-powered expert search
- **Input**: Natural language query
- **Process**:
  1. Groq API query analysis
  2. Expertise extraction
  3. Database query with filters
  4. Match score calculation
  5. Result ranking
- **Output**: Ranked expert list with match scores
- **Fallback**: Database search if AI fails

#### `create-booking`
- **Purpose**: Create booking and process payment
- **Input**: expertId, scheduledAt, durationMinutes, consumerNotes
- **Process**:
  1. User authentication
  2. Expert validation
  3. Price calculation (with commission)
  4. Stripe payment intent creation
  5. Booking record creation
- **Output**: Booking ID and payment intent client secret

#### `search`
- **Purpose**: Legacy search function
- **Input**: Search query
- **Output**: Mock or filtered results

#### `chat`
- **Purpose**: Chat functionality
- **Status**: Implementation details pending

### 4.2 Client-Side API

#### `lib/api.ts`
- `getExperts()`: Fetch experts with filters
- `getExpertById()`: Get single expert details
- `createExpertProfile()`: Create expert profile
- `updateExpertProfile()`: Update expert profile
- `searchExperts()`: Search experts
- `addAvailability()`: Add availability slot
- `getExpertAvailability()`: Get expert availability
- `getExpertTestimonials()`: Get testimonials
- `getExpertAchievements()`: Get achievements

#### `lib/adminApi.ts`
- Admin-specific API functions
- User management
- Expert approval
- Payment tracking

---

## 5. User Flows

### 5.1 Consumer Flow

1. **Landing Page** (`PromptPeople.tsx`)
   - View platform overview
   - Browse featured experts
   - Search for experts

2. **Search & Discovery**
   - Use AI-powered search
   - Filter by expertise, location, price
   - View expert profiles

3. **Expert Profile** (`ExpertProfile.tsx`)
   - View expert details
   - Check availability
   - Read reviews
   - View pricing

4. **Booking**
   - Select date/time
   - Choose duration
   - Enter notes
   - Complete payment

5. **Session Management**
   - Receive meeting link
   - Attend session
   - Leave review

### 5.2 Expert Flow

1. **Registration**
   - Sign up as user
   - Complete expert onboarding
   - Submit for verification

2. **Profile Setup**
   - Add expertise areas
   - Set hourly rate
   - Upload profile information
   - Set availability

3. **Wait for Approval**
   - Admin reviews profile
   - Verification status updated

4. **Active Expert**
   - Receive booking requests
   - Manage calendar
   - Conduct sessions
   - Track earnings

5. **Dashboard** (`ExpertDashboard.tsx`)
   - View bookings
   - Manage availability
   - Track performance
   - Update profile

### 5.3 Admin Flow

1. **Login**
   - Admin credentials
   - Access admin dashboard

2. **Expert Approval**
   - Review pending experts
   - Approve/reject profiles
   - Set verification status

3. **Platform Management**
   - Monitor users
   - Track payments
   - View analytics
   - Moderate content

---

## 6. Security & Privacy

### 6.1 Authentication Security
- Supabase Auth with email/password
- Email verification required
- Secure session management
- JWT token-based authentication

### 6.2 Data Security
- Row Level Security (RLS) on all tables
- User-specific data access policies
- Admin-only access to sensitive operations
- Secure API endpoints with authentication

### 6.3 Payment Security
- Stripe PCI-compliant payment processing
- Payment intents for secure transactions
- No direct card data storage
- Webhook verification

### 6.4 Privacy
- User data access controls
- Profile visibility settings
- Message privacy (booking participants only)
- GDPR considerations (profile deletion)

---

## 7. Business Model

### 7.1 Revenue Model
- **Commission-Based**: 15% default commission on each booking
- **Calculation**:
  - Platform Fee = Session Cost × 15%
  - Expert Payout = Session Cost - Platform Fee

### 7.2 Pricing Structure
- Experts set their own hourly rates
- Platform fee is transparent
- Payment processing via Stripe
- Automatic payout calculation

### 7.3 Monetization Features
- Booking fees
- Premium expert features (planned)
- Featured listings (planned)
- Advertising (planned)

---

## 8. Deployment & Infrastructure

### 8.1 Frontend Deployment
- **Build**: `npm run build` (Vite)
- **Output**: `dist/` directory
- **Hosting Options**:
  - Netlify
  - Vercel
  - Any static hosting service

### 8.2 Backend Infrastructure
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

### 8.3 Environment Variables

#### Frontend (.env)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

#### Edge Functions (Supabase Dashboard)
- `GROQ_API_KEY`
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 8.4 Development
- **Local Server**: `npm run dev` (port 8080)
- **Hot Reload**: Vite HMR
- **Type Checking**: TypeScript
- **Linting**: ESLint

---

## 9. Performance Optimizations

### 9.1 Frontend
- **Code Splitting**: Lazy loading of routes
- **React Query**: Caching and stale-time management
- **Image Optimization**: Lazy loading, placeholders
- **Bundle Optimization**: Vite tree-shaking

### 9.2 Backend
- **Database Indexes**: Performance indexes on foreign keys
- **Query Optimization**: Efficient database queries
- **Caching**: React Query client-side caching
- **Edge Functions**: Serverless scaling

### 9.3 Monitoring
- Error logging
- Performance metrics (planned)
- Analytics dashboard (admin)

---

## 10. Future Enhancements

### 10.1 Planned Features
- Enhanced gamification system
- Video call integration
- Mobile app (React Native)
- Advanced analytics
- Multi-language support
- Expert verification badges
- Subscription plans
- Referral program expansion

### 10.2 Technical Improvements
- RLS policy optimization (use `(select auth.uid())`)
- Additional database indexes
- Performance monitoring
- Automated testing
- CI/CD pipeline
- Documentation expansion

---

## 11. Key Metrics & Analytics

### 11.1 Platform Metrics
- Total experts
- Total bookings
- Average rating
- Total revenue
- Active users
- Conversion rates

### 11.2 Expert Metrics
- Booking completion rate
- Average rating
- Total sessions
- Earnings
- Response time

### 11.3 Consumer Metrics
- Bookings made
- Reviews left
- Satisfaction scores

---

## 12. Support & Documentation

### 12.1 User Support
- Contact email: kavin@irookee.com
- Help documentation (planned)
- FAQ section (planned)
- Support tickets (planned)

### 12.2 Developer Documentation
- README.md: Setup instructions
- Code comments: Inline documentation
- Type definitions: TypeScript types
- API documentation (planned)

---

## 13. Compliance & Legal

### 13.1 Terms & Conditions
- Terms of Service (planned)
- Privacy Policy (planned)
- Cookie Policy (planned)

### 13.2 Payment Compliance
- Stripe compliance
- PCI DSS (via Stripe)
- Refund policies

---

## 14. Conclusion

Irookee is a comprehensive expertise marketplace platform built with modern technologies and best practices. The platform successfully connects experts with consumers through an intuitive interface, AI-powered search, and secure payment processing. With a robust database schema, comprehensive security measures, and scalable architecture, Irookee is well-positioned for growth and expansion.

The platform's commission-based business model provides sustainable revenue while maintaining transparency for both experts and consumers. The ongoing migration from "Speaker" to "Expert" terminology reflects the platform's evolution and commitment to clarity.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Platform Version**: 0.0.0  
**Status**: Active Development

