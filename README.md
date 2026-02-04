# Irookee - Peer-to-Peer Expertise Marketplace

A modern platform connecting users with verified experts across various domains for one-on-one sessions. Built with AI-powered matching and secure payment processing.

## 🚀 Features

- **AI-Powered Search**: Intelligent expert matching using Groq API
- **Expert Profiles**: Comprehensive profiles with ratings, availability, and expertise areas
- **Booking System**: Seamless booking flow with Stripe payment integration
- **Commission-Based Model**: Platform takes a commission (default 15%) from each booking
- **Review System**: Users can review experts after completed sessions
- **Availability Management**: Experts can set recurring or one-time availability slots

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn-ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Groq API (for intelligent expert matching)
- **Payment**: Stripe (open-source libraries)

## 📋 Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account and project
- Stripe account
- Groq API key

## 🏃 Getting Started

### 1. Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd talktalent-finder-main
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```sh
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 4. Set Up Database

Apply the migration file in your Supabase project:

```sh
# Using Supabase CLI
supabase migration up

# Or apply manually through Supabase Dashboard
```

The migration file is located at:
`supabase/migrations/20250120000000_expertise_marketplace_schema.sql`

### 5. Configure Supabase Edge Functions

Set these environment variables in Supabase Dashboard -> Project Settings -> Edge Functions:
- `GROQ_API_KEY` - Your Groq API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### 6. Deploy Edge Functions

```sh
# Deploy search-experts function
supabase functions deploy search-experts

# Deploy create-booking function
supabase functions deploy create-booking
```

### 7. Start Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── expert/        # Expert-related components
│   ├── booking/       # Booking flow components
│   └── ui/            # shadcn-ui components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
└── pages/              # Page components

supabase/
├── functions/         # Edge Functions
└── migrations/        # Database migrations
```

## 🚢 Deployment

### Build for Production

```sh
npm run build
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Deploy to Vercel

1. Connect your repository to Vercel
2. Vercel will automatically detect Vite
3. Add environment variables in Vercel dashboard

## 📚 Documentation

For detailed implementation information, see [IMPLEMENTATION.md](./IMPLEMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is private and proprietary.
