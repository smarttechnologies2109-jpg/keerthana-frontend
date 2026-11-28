# KEERTHANA — Christian Music Streaming

<p align="center">
  <strong>A dedicated space for Christian music, worship, and listening.</strong>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white" />
  <img alt="Platform" src="https://img.shields.io/badge/Platforms-Web%20%7C%20Android-0A7EA4" />
</p>

KEERTHANA is a React-based Christian music experience with a responsive web interface and an Android application powered by Capacitor. It brings together music discovery, personal libraries, playlists, listening history, multilingual preferences, and account experiences in one application.

> **Repository:** [smarttechnologies2109-jpg/keerthana-frontend](https://github.com/smarttechnologies2109-jpg/keerthana-frontend)

---

## Contents

- [Product highlights](#product-highlights)
- [Music and discovery](#music-and-discovery)
- [Player experience](#player-experience)
- [Personal library and account](#personal-library-and-account)
- [Rewards and membership](#rewards-and-membership)
- [AI and additional experiences](#ai-and-additional-experiences)
- [Administration and business management](#administration-and-business-management)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Android development](#android-development)
- [Configuration notes](#configuration-notes)
- [Quality and accessibility](#quality-and-accessibility)
- [Contributing](#contributing)

## Product highlights

- Responsive experience designed for desktop, tablet, and mobile screens.
- Dedicated Christian music catalogue and browsing experience.
- Song, artist, album, category, and ministry discovery pages.
- Personal music collections, playlists, favourites, and listening history.
- User profile with editable name, profile photo, and preferred language.
- Premium membership and rewarded-ad listening reward experiences.
- Dedicated admin and business-owner workspaces.
- Android integration through Capacitor.

## Music and discovery

The application includes dedicated experiences for:

- Home and music discovery
- All songs and recently added songs
- Search
- Song details
- Artists and artist details
- Albums and album details
- Categories and category details
- Ministries and ministry details
- Mood-based playlists and mood songs

## Player experience

The player experience is built around listening and music-library workflows. The frontend includes player components for full and compact playback experiences, alongside queue and lyrics-related UI.

Current player interface capabilities include:

- Full player and mini-player experiences
- Playback controls and playback state UI
- Queue access
- Lyrics presentation with active-line highlighting where timestamped lyrics are available
- Lyrics focus mode and manual synchronization controls
- Song-language labels when language metadata is available
- Localised player control labels for supported languages

Actual playback, media availability, and metadata depend on the connected application services and the data returned by the backend.

## Personal library and account

Listeners can access:

- Liked songs
- Favourites
- Playlists and playlist details
- Listening history
- Downloads manager
- Notifications
- Listening statistics
- Profile and account details

The profile page provides account information, profile-image upload, preferred-language selection, membership information, music-library statistics, quick access to personal music pages, and sign-out.

Supported language options in the account experience include Telugu, Hindi, English, Malayalam, Kannada, and Tamil.

## Rewards and membership

KEERTHANA includes membership and listening-reward experiences:

- Premium and pricing pages
- Ad-free reward page
- Rewarded-video flow for eligible listening rewards
- Reward-status refresh
- Reward activation based on server-side verification

The ad-free reward interface does not itself grant listening time. The reward service and server-side verification determine whether a reward is activated. Reward availability and duration are controlled by the configured backend and ad provider.

On Android, the application integrates the Capacitor AdMob plugin. App Open ad handling is configured in the application code with safeguards intended to avoid showing an App Open ad while music is playing. Ad availability is subject to platform, consent, and provider configuration.

## AI and additional experiences

The frontend contains a dedicated KEERTHANA AI page. Its available capabilities depend on the backend/API services connected to the application.

Additional pages include About Us, Contact Us, Donations, Privacy Policy, Terms and Conditions, Refund and Cancellation, and Copyright Policy.

## Administration and business management

### Admin workspace

The admin area includes:

- Admin login and forgot-password pages
- Admin dashboard
- Song management, add-song, and edit-song workflows
- Song reports
- Artist management
- Album management
- Category management
- User management
- Ministry management

### Business-owner workspace

The business-owner area includes:

- Business-owner login and forgot-password pages
- Business-owner dashboard
- User management
- Statistics
- Music and song management
- Album management
- Artist management
- Category management
- Ministry management

Administrative and business-owner access is handled through the application's route/layout components. Actual authorization and data permissions must also be enforced by the backend.

## Technology stack

| Area | Technology |
|---|---|
| UI library | React 19 |
| Build tool and development server | Vite 8 |
| Routing | React Router DOM 7 |
| Native Android bridge | Capacitor 8 |
| HTTP client | Axios |
| Icons | Lucide React, React Icons |
| Image cropping UI | react-easy-crop |
| Android advertising | @capacitor-community/admob |
| Android media session | @capgo/capacitor-media-session |
| Linting | Oxlint |

The project uses JavaScript and JSX with ES modules.

## Project structure

A simplified view of the frontend:

```text
.
├── android/                  # Capacitor Android project (if present)
├── public/                   # Static public assets
├── src/
│   ├── assets/
│   │   └── css/              # Application stylesheets
│   ├── components/           # Shared UI and layout components
│   │   ├── admin/            # Admin layout and components
│   │   └── businessOwner/    # Business-owner components
│   ├── context/              # Player, language, likes and notifications state
│   ├── hooks/                # Reusable React hooks
│   ├── pages/                # User-facing pages
│   │   ├── admin/            # Admin pages
│   │   └── businessOwner/    # Business-owner pages
│   ├── services/             # API and application service integrations
│   ├── utils/                # Shared utilities and helpers
│   └── App.jsx               # Application providers and route definitions
├── capacitor.config.json
├── package.json
└── vite.config.js
```

Some folders shown above may be generated or present only in particular development environments.

## Getting started

### Prerequisites

- Node.js with npm
- Git
- Access to the KEERTHANA backend/API services for features that require server data
- Android Studio and Android SDK for native Android development

### 1. Clone the repository

```bash
git clone https://github.com/smarttechnologies2109-jpg/keerthana-frontend.git
cd keerthana-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite prints the local development URL in the terminal (commonly `http://localhost:5173`).

### 4. Create a production build

```bash
npm run build
```

The production output is generated in the `dist/` directory.

### 5. Preview the production build locally

```bash
npm run preview
```

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

## Android development

KEERTHANA uses Capacitor for its Android application. The current Capacitor configuration identifies the app as:

- **App name:** Keerthana
- **Application ID:** `com.keerthana.music`
- **Web output directory:** `dist`

After building the web application, sync the generated assets with the native project:

```bash
npm run build
npx cap sync android
npx cap open android
```

Run and package the Android application from Android Studio using the configured Android SDK and signing setup.

For a newly added native plugin or a changed native configuration, run Capacitor sync and rebuild the Android application.

## Configuration notes

- The frontend communicates with application services through its service/API layer. Ensure the correct backend is available and that the API base URL/configuration used by the project matches your environment.
- Do not commit API secrets, private keys, signing credentials, access tokens, or production-only identifiers.
- AdMob requires valid platform configuration, consent handling, and correctly configured ad unit IDs. Use test ad units during development and verify production IDs before release.
- Reward activation must remain server-verified; a client-side ad completion callback is not proof that a reward has been credited.
- Keep backend and frontend API contracts compatible when changing profile, playlist, playback, reward, or admin functionality.

## Quality and accessibility

The interface uses responsive layouts and includes reduced-motion handling in enhanced page styles. When contributing UI changes:

- Check narrow mobile widths as well as desktop layouts.
- Keep interactive controls keyboard accessible and provide clear focus states.
- Respect `prefers-reduced-motion`.
- Avoid blocking initial rendering with non-essential work.
- Preserve existing API contracts, route behavior, authentication flows, and playback state.
- Test user, admin, and business-owner access paths where relevant.

## Contributing

1. Create a focused branch for your change.
2. Keep changes scoped and preserve existing behavior.
3. Run `npm run lint` and `npm run build` before submitting when possible.
4. Test the affected flow in the browser and, for native changes, on Android.
5. Describe user-visible changes and any backend or configuration requirements in your pull request.

---

<p align="center">
  <strong>KEERTHANA</strong><br />
  <em>Music for faith. Songs for every moment.</em>
</p>
