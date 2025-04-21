# Local Time Capsule App

A web application that allows users to create virtual time capsules tied to specific locations. These time capsules can only be unlocked when the user is physically present at the designated location after a specified date has passed.

## Features

- **Create Time Capsules**: Add text, images, and videos to preserve your memories
- **Location-based Unlocking**: Capsules can only be opened when you're at the right place
- **Time-based Locking**: Set a future date when your capsule will become unlockable
- **Public Sharing**: Option to make unlocked capsules visible to other users
- **Interactive Map**: Explore capsules on a map interface
- **User Authentication**: Secure login with email/password or Google authentication

## Tech Stack

- **Frontend**: React.js with Next.js, Tailwind CSS for styling
- **Maps**: React Leaflet for interactive maps and location selection
- **Authentication**: Firebase Auth with email/password and Google sign-in
- **Database**: Firebase Firestore for storing capsule data
- **Storage**: Firebase Storage for storing images and videos
- **Hosting**: Deploy on Vercel or Netlify

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A Firebase account

### Step 1: Clone the repository

```bash
git clone <your-repository-url>
cd timecapsule-app
```

### Step 2: Install dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Set up Firebase

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Enable Firebase Storage
5. Get your Firebase configuration (API Key, Auth Domain, etc.)
6. Update the Firebase configuration in `src/lib/firebase.ts`

### Step 4: Set up Leaflet Map files

Create a `public/images` folder and add the required Leaflet marker icons:
- Download marker-icon.png, marker-icon-2x.png, and marker-shadow.png from the Leaflet repository
- Place them in the `public/images` folder

### Step 5: Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Project Structure

- `/src/components` - Reusable UI components
- `/src/context` - React context for state management
- `/src/lib` - Utility functions and services (Firebase, geolocation)
- `/src/pages` - Next.js pages and routes
- `/src/styles` - Global CSS and styling
- `/src/types` - TypeScript type definitions
- `/src/utils` - Helper functions

## Deployment

The app can be deployed on Vercel or Netlify:

### Deploy on Vercel

```bash
npm run build
vercel
```

### Deploy on Netlify

```bash
npm run build
netlify deploy
```

## License

[MIT](LICENSE)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.