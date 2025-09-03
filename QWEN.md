# Project Context for DClass

## Project Overview

DClass is a React-based business process management application built with Vite. The application allows users to create and manage projects and workflows (called "flows") for business processes. It uses Firebase for authentication, Firestore for data storage, and Firebase Storage for file storage.

Key technologies:
- React 19 with React Router v7
- Vite build tool
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS (likely through a CDN or pre-built classes)
- XYFlow for workflow visualization
- Date-fns for date manipulation
- jsPDF and html-to-image for document generation
- React Dropzone for file uploads

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components (Login, Signup)
│   │   ├── common/         # Shared components
│   │   ├── flow/           # Workflow-specific components
│   │   ├── Dashboard.jsx   # Main dashboard view
│   │   ├── FlowPage.jsx    # Workflow editing page
│   │   ├── Project.jsx     # Project component
│   │   ├── ProjectPage.jsx # Project details page
│   │   └── ProtectedRoute.jsx # Route protection wrapper
│   ├── config/
│   │   └── firebase.js     # Firebase configuration and initialization
│   ├── contexts/
│   │   └── AuthContext.jsx # Authentication context and provider
│   ├── utils/
│   │   └── storageCleanup.js # Utility for cleaning up storage
│   ├── App.jsx             # Main application component with routing
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── dist/                   # Production build output
├── node_modules/           # Dependencies
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite configuration
└── eslint.config.js        # ESLint configuration
```

## Application Features

1. **User Authentication**:
   - Email/password registration and login
   - Google OAuth login
   - Session persistence
   - Protected routes that require authentication

2. **Project Management**:
   - Create, view, and delete projects
   - Each project contains multiple workflows ("flows")
   - Project-level organization of business processes

3. **Workflow Management**:
   - Create, view, and delete workflows within projects
   - Workflow editing interface using XYFlow
   - Status tracking for workflows

4. **Data Storage**:
   - Firebase Firestore for structured data (projects, flows)
   - Firebase Storage for file uploads
   - Real-time data synchronization

## Key Components

1. **AuthContext**: Provides authentication state and functions throughout the app
2. **Dashboard**: Main view showing all projects with expandable flows
3. **FlowPage**: Workflow editing interface using XYFlow
4. **ProtectedRoute**: Wrapper component that restricts access to authenticated users
5. **Firebase Configuration**: Handles connection to Firebase services with emulator support

## Development Environment

The application uses Vite as its build tool with React plugin. Firebase emulator support is built-in for local development.

### Environment Variables

The application expects the following environment variables (typically in a `.env` file):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_USE_EMULATOR=true (for development)
VITE_ENABLE_ANALYTICS=false (optional)
```

## Building and Running

### Development
```bash
npm run dev
```
Starts the development server with hot module replacement.

### Production Build
```bash
npm run build
```
Creates a production-ready build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```
Locally previews the production build.

### Linting
```bash
npm run lint
```
Runs ESLint on the project files.

## Development Conventions

1. **Component Structure**: 
   - Components are organized by feature/domain
   - Authentication components are in `src/components/auth/`
   - Shared components are in `src/components/common/`
   - Workflow-specific components are in `src/components/flow/`

2. **State Management**:
   - React Context API for global state (authentication)
   - Component-level state for UI interactions
   - Firebase real-time listeners for data synchronization

3. **Styling**:
   - Tailwind CSS classes (based on dependencies)
   - Minimal custom CSS in component files
   - Global styles in `src/index.css`

4. **Routing**:
   - React Router v7 for client-side routing
   - Protected routes for authenticated views
   - Nested routes for project and flow management

5. **Firebase Integration**:
   - Firestore for structured data with real-time listeners
   - Firebase Authentication for user management
   - Firebase Storage for file uploads
   - Emulator support for local development

## Firebase Data Structure

The application uses a hierarchical data structure in Firestore:
```
companies/
  └── [userId]/
      ├── projects/
      │   └── [projectId]/
      │       └── flows/
      │           └── [flowId]/
      └── users/
          └── [userId]/
```

Each project contains multiple flows, which represent individual business process workflows.

## Testing

Currently, there's no explicit testing configuration in package.json scripts. Testing would likely need to be added with Jest/Vitest for unit tests and Cypress/Playwright for end-to-end tests.

## Deployment

The application is configured for deployment with Firebase Hosting, as indicated by the `firebase.json` file. The build process creates static assets that can be deployed to any static hosting provider.