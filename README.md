# RestoRadar

Restaurant directory using React, HeroUI v2, Lucide, Express and the supplied 3,772-record dataset. Descriptions summarize actual recorded fields and are editable. No phone fields.

## Install and run locally

### What you need

- Node.js and npm. This project has been tested with **Node.js 24**. Check your installation with `node --version` and `npm --version`.
- The complete project folder, including `package.json`, `package-lock.json`, `data/restaurants.json`, and `public/images`.
- A terminal such as Windows PowerShell. MongoDB Atlas is optional for local use.

### 1. Open the app folder

Open a terminal in the folder containing `package.json`. If you have the complete workspace, this is its `app` folder.

```powershell
cd "C:\path\to\RestoRadar\app"
```

Replace the example path with your actual folder location. If your downloaded project has `package.json` directly inside `RestoRadar`, open that folder instead.

### 2. Install dependencies

```powershell
npm install
```

Wait for installation to finish. Internet access is needed for this step; the included photos and restaurant data do not need to be downloaded separately.

### 3. Configure local administrator access

For a fresh installation, copy the example settings:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, edit it instead of overwriting it. Open `.env` in a text editor and set these values for the classroom demo:

```dotenv
PORT=5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MONGODB_URI=
```

Leave `MONGODB_URI` empty to use the included dataset. Generate the session signing secret with this command, from the same app folder:

```powershell
node -e "const fs=require('node:fs');const crypto=require('node:crypto');const text=fs.readFileSync('.env','utf8');fs.writeFileSync('.env',text.replace(/^SESSION_SECRET=.*$/m,'SESSION_SECRET='+crypto.randomBytes(48).toString('hex')));"
```

This replaces the blank `SESSION_SECRET` line supplied in `.env.example`. Keep `.env` private. Generating a new secret invalidates existing sign-in sessions. The login page intentionally displays `admin` / `admin123` as classroom example credentials.

### 4. Start the app

```powershell
npm run dev
```

Keep the terminal open and visit **http://localhost:5173**. Use the address printed in the terminal if you changed `PORT`. Click **Admin Login** in the footer and sign in with `admin` / `admin123` to add, edit, or delete records.

To stop the app, press **Ctrl+C** in the terminal. To start it again, run `npm run dev`; you do not need to reinstall dependencies each time.

### Local data

Without an Atlas connection, the application displays **Local dataset**. Changes persist in `data/local-records.json`; the original `data/restaurants.json` stays untouched. Local mode does not satisfy the course's Atlas synchronization requirement.

### Run the built version

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Open the same local address. To return to development mode in that PowerShell window, stop the server and run:

```powershell
Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
npm run dev
```

### Troubleshooting

| Problem                               | What to do                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node` or `npm` is not recognized     | Install Node.js with npm, then reopen the terminal.                                                                                                     |
| PowerShell blocks `npm.ps1`           | Use `npm.cmd install` and `npm.cmd run dev` instead.                                                                                                    |
| `package.json` cannot be found        | Open the app folder that contains `package.json`.                                                                                                       |
| The browser cannot connect            | Keep the server running and open the exact address printed in the terminal.                                                                             |
| Port is already in use                | Stop the previous server, or change `PORT` in `.env` to `5174` and restart.                                                                             |
| Admin Login says it is not configured | Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in `.env`, then restart.                                                                   |
| Incorrect username or password        | Confirm the values in `.env`; restart after editing them.                                                                                               |
| Restaurant API unavailable            | Start the application with `npm run dev` or the production commands above. Opening `index.html` directly or serving only `dist` does not start the API. |
| Dataset is missing                    | Restore `data/restaurants.json` from the complete project files.                                                                                        |

## Connect Atlas

1. Create an Atlas cluster and database user, and allow your development computer's IP address.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`. Keep credentials private.
3. Run `npm run import:atlas`. It inserts missing IDs and preserves existing records. Extended JSON dates become MongoDB dates.
4. Restart `npm run dev`; confirm **MongoDB Atlas** and the expected count.

Default database: `dbRestaurants`; collection: `restaurants`. Both are configurable. Atlas mode uses insertOne, updateOne, deleteOne and aggregate pipelines.

## Deploy to Vercel

Deploy this entire folder, not only `dist`. Set the project Root Directory to the folder containing this package.json (use `app` if uploading the parent workspace). Build command: `npm run build`; output: `dist`. Keep `api/index.js`, `server.js`, `auth.js`, `model.js`, `vercel.json`, and `data/restaurants.json` in the uploaded source. vercel.json routes /api requests to a Node function and includes the dataset in that function. The JSON file is backend data, so it does not appear in the public dist folder.

Without Atlas, Vercel is a read-only preview because function-local file writes are not durable. Add MONGODB_URI, MONGODB_DB and MONGODB_COLLECTION in Vercel environment settings for database-backed operation, import the dataset separately, and redeploy. Configure administrator credentials before using hosted editing.

## Verify / build

Run `npm test` and `npm run build`. For the built app set `NODE_ENV=production`, then run `npm start`.

## Behavior

Search by name/cuisine/borough; filters and pagination; cards/tables; borough groups; configurable score aggregation; details with complete inspection history; administrator restaurant and inspection views; validated add/edit and confirmed delete.

Inspection scores are historical records, not customer star ratings. Aggregate sums every recorded inspection score and sorts descending. New restaurants have no inspections. Editing preserves ID, inspection history and coordinates. The administrator workspace and mutation endpoints require administrator sign-in.

## Submission

Capture home, directory, search by name, search by cuisine, boroughs, insights, details, management, inspection records, add/edit and delete confirmation. Include complete source and package lock; omit node_modules and .env. Print blueprint.html. Add a title page with actual student/group/course details. Complete the instructor's AI declaration and peer evaluation forms honestly. Signatures and peer assessments come from students.

## AI-use declaration

See `AI_USE_NOTES.md` when completing the required declaration.

## References

[HeroUI v2](https://v2.heroui.com/docs/guide/introduction), [MongoDB Node CRUD reference](https://www.mongodb.com/docs/drivers/node/current/reference/quick-reference/). Included dataset: `data/restaurants.json`.

Atlas synchronization remains unverified until configured and tested against your account.

Dependency audit: seven reported findings in the Tailwind v3 pattern/selector tooling dependency chain (five high, two moderate). The suggested automatic fix migrates to Tailwind v4 and is incompatible with this configured HeroUI v2 setup; no forced migration was applied. This limitation is recorded for future maintenance.

Real stock photography is bundled in public/images; source links and license are recorded in public/photo-credits.html. Photos illustrate cuisines and New York and are not individual restaurant photos.

## Administrator access

Admin Login is in the footer. Administrator routes and restaurant mutations require a signed, HttpOnly, SameSite=Strict session cookie, expiring after eight hours. Configure ADMIN_USERNAME, ADMIN_PASSWORD, and SESSION_SECRET in server environment settings. For Vercel, set all three variables in project environment settings and redeploy; credentials are never embedded in the frontend. Vercel cookies use Secure. Sign-out clears the browser cookie. Password changes should also rotate SESSION_SECRET. Login attempts are throttled within a server instance; multi-instance production hosting needs a shared rate limiter. Atlas remains required for hosted durable edits.

## Source organization and formatting

- `src/main.jsx`: application state, navigation, and page composition.
- `src/components/`: administrator login, restaurant editor, and photo display.
- `src/api.js`: shared API requests and error handling.
- `src/constants.js`: borough names and display themes.
- `src/photo-selection.js`: selection of illustrative photos.
- `server.js`, `auth.js`, `model.js`: API routes, administrator sessions, and database logic.
- `tests/`: behavioral checks for data, authentication, photos, and hosting.

Run `npm run format` to format the source, or `npm run format:check` to check it. Data, private settings, generated builds, and image assets are excluded.
