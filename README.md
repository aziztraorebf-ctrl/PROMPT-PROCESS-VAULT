# PromptVault

> Professional Prompt & Process Vault for AI workflows

A modern, organized workspace for managing AI prompts, assets, and frameworks. Built with React, TypeScript, Firebase, and Tailwind CSS.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)

## ✨ Features

### 🏠 Dashboard
- Personalized hero with user greeting
- Quick actions for common tasks
- Activity statistics with visual indicators
- Recently added items carousel
- Dark mode support

### 📝 Prompts
- **Split-screen editor**: List + editor side-by-side
- Full-text search with highlighting
- Category filtering (UI/UX, Code, Marketing, etc.)
- Favorite system
- Responsive design (mobile-friendly)

### 🖼️ Assets
- **Masonry layout** (Pinterest-style grid)
- Image upload with preview
- AI-powered analysis (Magic Analysis)
- Collection-based organization
- Modal detail view

### 📦 Frameworks
- Process and methodology storage
- Tag-based organization
- Quick creation workflow

## 🏗️ Architecture

```
src/
├── components/ui/          # Reusable UI components
│   ├── Button.tsx         # Variants: primary, secondary, ghost, danger
│   ├── Card.tsx           # Hover effects, selection states, badges
│   ├── Input.tsx          # Label, error states, icons
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── useTheme.ts        # Dark/light/system mode
│   └── useCollection.ts   # Optimized Firebase data fetching
├── lib/                    # Utilities and config
│   ├── firebaseConfig.ts  # Firebase initialization
│   └── theme.ts           # Theme definitions
├── types/                  # TypeScript definitions
│   └── index.ts
├── views/                  # Page-level components
│   ├── Dashboard.tsx
│   ├── Prompts.tsx
│   ├── Assets.tsx
│   └── Frameworks.tsx
├── App.tsx                 # Main app with routing
└── main.tsx               # Entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (free tier sufficient)

### 1. Clone the Repository

```bash
git clone https://github.com/aziztraorebf-ctrl/PROMPT-PROCESS-VAULT.git
cd PROMPT-PROCESS-VAULT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

To get these values:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Project Settings → General → Your apps → Web app
4. Copy the config values

### 4. Set Up Firebase Services

#### Authentication
1. Firebase Console → Authentication → Get Started
2. Enable "Email/Password" provider

#### Firestore Database
1. Firebase Console → Firestore Database → Create database
2. Start in test mode (for development)
3. Create collections: `prompts`, `assets`, `frameworks`

#### Storage (for assets)
1. Firebase Console → Storage → Get Started
2. Set up security rules for authenticated users

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment Options

### Option A: Vercel (Recommended)

Best for:
- Automatic preview deployments for each PR
- Excellent React/Vite support
- Built-in analytics
- Generous free tier

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for auto-deployments.

### Option B: Firebase Hosting

Best for:
- Keeping everything in Firebase ecosystem
- Simple setup
- Good integration with Firebase services

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### Option C: Netlify

Similar to Vercel with slightly different features:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_GEMINI_API_KEY` | For AI analysis (optional) | No |

## 🎨 Customization

### Adding New Categories

Edit the category arrays in:
- `src/views/Prompts.tsx` - `CATEGORIES` array
- `src/views/Assets.tsx` - `COLLECTIONS` array

### Changing Theme Colors

Edit `src/lib/theme.ts`:
```typescript
export const lightTheme: Theme = {
  colors: {
    primary: '#your-color',
    // ...
  }
}
```

## 📝 Development Workflow

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/my-feature`
5. Create PR (triggers Vercel preview if configured)
6. Merge to main (auto-deploys to production)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Made with ❤️ for AI workflow optimization**
