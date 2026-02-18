# Hospital ERP Revamp (SaaS)

A modern, high-performance Hospital Management System built with React, Vite, and Firebase.

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Firebase Configuration
This project requires a Firebase project. 
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password).
3. Create a **Firestore Database** and a **Storage** bucket.
4. Copy your Web App configuration and paste it into `src/firebase.js`.

### 3. Development
Run the development server:
```bash
npm run dev
```

### 4. Build
Generate a production-ready build:
```bash
npm run build
```

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase (Auth, Firestore, Storage)
- **PDF Generation**: jsPDF


## Setup Super Admin
- **URL**: http://domain.com/setup-superadmin
<!-- Set up the login for super admin -->