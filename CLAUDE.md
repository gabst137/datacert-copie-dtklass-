# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (usually runs on port 5173-5176)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Architecture Overview

This is a **Business Process Management Application** built with React + Vite and Firebase, designed for managing GDPR compliance workflows.

### Core Stack
- **Frontend**: React 19 with React Router for navigation
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (responsive design)
- **Backend**: Firebase (Authentication + Firestore database)
- **PDF Generation**: jspdf with jspdf-autotable
- **Flow Diagrams**: @xyflow/react

### Data Architecture

**Firestore Structure:**
```
/companies/{userId}/
  /projects/{projectId}/
    - projectName, createdAt
    /flows/{flowId}/
      - flowName, flowDescription, status, valid
      - selectedUsers, lastModified
      - formData: {generalData, peopleData, legalData, processingData, storageData, securityData}
      - categoryMatrix: {[categoryId]: {enumerare, method, period, storageOnly, legalBasis}}
      - processes, diagramData
```

### Component Architecture

**Key Components:**
- `Dashboard.jsx`: Main entry - project/flow management with real-time Firestore listeners
- `FlowPage.jsx`: Multi-tab flow editor (7+ tabs) with manual save via "Salvează" button
- `flow/tabs/*`: Individual tab components for different data aspects
- `AuthContext`: Firebase authentication state management

**Navigation Flow:**
```
Login → Dashboard → ProjectPage → FlowPage (with tabs)
         ↓
    Create/Manage Projects → Create/Manage Flows
```

### State Management Pattern
- **Authentication**: React Context (AuthContext)
- **Data**: Direct Firestore integration with real-time listeners
- **Forms**: Controlled components with parent state management
- **Save Strategy**: Manual save only (no auto-save) - data persists when user clicks "Salvează"

## Important Implementation Details

### DataCategoriesTab Component
Recently rebuilt to fix input focus issues:
- Components defined outside main function to prevent recreation
- Direct state manipulation without draft/debouncing
- Uses React.memo for optimization
- Simple controlled inputs that update parent state immediately

### Firebase Configuration
- Config stored in `src/config/firebase.js`
- Authentication methods: Email/password + Google OAuth
- Persistent auth state via localStorage
- Protected routes wrapper component

### Tab System in FlowPage
Current tabs: Date generale, Persoane vizate, Detalii temei legal, Prelucrare date, Categorii date, Stocare date, Securitate
- Each tab has its own component in `src/components/flow/tabs/`
- Data flows up to FlowPage which handles saving to Firestore
- No individual tab auto-save - all saves happen through main save button

## Current Development Focus

The app is in active development with core functionality complete:
- ✅ Authentication system
- ✅ Project/flow CRUD operations  
- ✅ Multi-tab data entry forms
- ✅ Real-time data synchronization
- ✅ PDF export capability
- ✅ Flow diagram visualization

Next priorities involve completing remaining tab implementations and adding advanced features like templates and batch operations.

## Known Issues & Solutions

**Input Focus Loss in Forms**: 
- Solution: Define input components outside main component function
- Use React.memo to prevent unnecessary re-renders
- Avoid inline component definitions

**Firebase Development**: 
- Ensure Firebase project is properly configured
- Check authentication settings in Firebase Console
- Firestore security rules currently allow authenticated users full access to their data