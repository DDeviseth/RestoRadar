# RestoRadar

A restaurant directory built with **React, HeroUI v2, Lucide, Express, and MongoDB Atlas**, featuring a supplied dataset of 3,772 restaurant records.

Restaurant descriptions summarize recorded fields and are editable. No phone fields are included.

## Features

- Search by restaurant name, cuisine, and borough
- Filtering, pagination, cards, and tables
- Borough grouping and configurable inspection-score aggregation
- Restaurant details and inspection history
- Administrator dashboard for adding, editing, and deleting records
- Validated forms and confirmed deletions

> **Note:** Inspection scores are historical records, not customer star ratings.

## Requirements

- Node.js 24 and npm
- Complete project folder with `package.json`, `data/restaurants.json`, and `public/images`
- Internet connection for installing dependencies
- MongoDB Atlas for persistent hosted edits and database synchronization

## Installation

### 1. Navigate to the project folder

```powershell
cd "C:\path\to\RestoRadar\app"
```

Open the folder containing `package.json`.

### 2. Install dependencies

```powershell
npm install
```

If PowerShell blocks `npm.ps1`, use `npm.cmd install`.

### 3. Configure environment variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Configure `.env`:

```dotenv
PORT=5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MONGODB_URI=
SESSION_SECRET=your-generated-secret
```

Generate a secure session secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Replace `your-generated-secret` with the generated value. Keep `.env` private and never commit it to GitHub.

### 4. Start the application

```powershell
npm run dev
```

Open **http://localhost:5173** in your browser.

Click **Admin Login** in the footer to manage restaurant records. The example credentials are `admin` / `admin123` when configured as shown above.

Press `Ctrl+C` to stop the server.

## Data Storage

### Local Mode

When `MONGODB_URI` is empty, the application uses the included dataset. Changes are saved to `data/local-records.json`, leaving the original `data/restaurants.json` unchanged.

Local mode does not satisfy the Atlas synchronization requirement.

### MongoDB Atlas

1. Create an Atlas cluster and database user.
2. Allow your development IP address.
3. Set `MONGODB_URI` in `.env`.
4. Import the dataset:

   ```powershell
   npm run import:atlas
   ```

5. Restart the application and verify the connection and record count.

Default database: `dbRestaurants`

Default collection: `restaurants`

Both are configurable.

## Build and Test

Run the automated tests and build the frontend:

```powershell
npm test
npm run build
```

To run the production build locally:

```powershell
$env:NODE_ENV="production"
npm start
```

## Deployment to Vercel

1. Deploy the complete application source, not just the `dist` folder.
2. Set the project Root Directory to the folder containing `package.json`.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Configure these environment variables in Vercel:

   - `MONGODB_URI`
   - `MONGODB_DB`
   - `MONGODB_COLLECTION`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`

6. Import the dataset into Atlas and redeploy.

**Important:** Without MongoDB Atlas, the Vercel deployment is read-only because serverless file changes are not durable.

## Security

- Administrator routes and mutations require authentication.
- Sessions use signed, HttpOnly, SameSite=Strict cookies and expire after eight hours.
- Vercel uses Secure cookies.
- Keep administrator credentials and session secrets out of frontend code and version control.
- Hosted editing requires MongoDB Atlas for persistent storage.

## Project Structure

```text
app/
├── api/
│   └── index.js
├── data/
│   └── restaurants.json
├── public/
│   └── images/
├── src/
│   ├── components/
│   ├── api.js
│   ├── constants.js
│   ├── main.jsx
│   └── photo-selection.js
├── tests/
├── auth.js
├── model.js
├── network.js
├── server.js
├── package.json
├── vercel.json
└── .env.example
```

## Formatting

Format the source code:

```powershell
npm run format
```

Check formatting without modifying files:

```powershell
npm run format:check
```
