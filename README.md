# PuiPui Client

A modern web application built with React and TypeScript for discovering and managing points of interest (POIs).

## 🚀 Technologies

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Supabase** - Backend and authentication
- **Tailwind CSS** - Utility-first CSS framework

## 📋 Features

- User authentication via Supabase
- Browse and discover points of interest
- Responsive design for all screen sizes
- Type-safe development with TypeScript

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd puipui-client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the project root with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these credentials in your Supabase project settings.

## 🏃 Running the Application

### Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components
├── pages/              # Page components
│   ├── AuthPage.tsx    # Authentication page
│   └── HomePage.tsx    # Home/main page
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   └── usePois.ts      # Points of interest hook
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client setup
│   └── utils.ts        # Helper functions
├── App.tsx             # Root component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🔐 Authentication

The application uses Supabase for user authentication. Users can sign up and log in through the AuthPage component. The `useAuth` hook provides authentication state and methods throughout the application.

## 📍 Points of Interest

Browse and discover points of interest using the `usePois` hook, which handles fetching and managing POI data from Supabase.

## 📝 License

This project is private and proprietary.
