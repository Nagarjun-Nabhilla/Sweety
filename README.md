# Sweety

A blood glucose tracker. Record up to four readings a day, then review them in reports and monthly charts.

Built with PostgreSQL, Express, React and Node.

## Requirements

- Node.js 20.19 or newer (if you use Node 22, 22.12 or newer)
- PostgreSQL (developed on version 16), running locally

## Install

Install the packages for the server and the client, starting from the project root:

```
cd server
npm install
cd ../client
npm install
cd ..
```

## Set up the database

1. Go to the `server` folder and create your `.env` file from the example:

   ```
   cd server
   cp .env.example .env
   ```

   On Windows Command Prompt, use `copy .env.example .env`.

2. Edit `server/.env`:

   | Variable | What to set |
   | --- | --- |
   | `PGUSER`, `PGPASSWORD` | Your PostgreSQL username and password. This user must be allowed to create databases. |
   | `PGHOST`, `PGPORT` | Where PostgreSQL runs. The defaults suit a local install. |
   | `PGDATABASE` | Keep this as `sweety`. The seed script runs only against that name. |
   | `JWT_SECRET` | A long random string, used to sign login tokens. |
   | `PORT` | Keep this as `5000`. The client's development proxy expects that port. |
   | `CLIENT_URL` | Where the client runs, used to build password reset links. The default suits local development. |

   To generate a `JWT_SECRET`:

   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Create the database and tables. This never deletes existing data.

   ```
   npm run db:setup
   ```

4. Optional: add a demo user with 90 days of sample readings.

   ```
   npm run db:seed
   ```

   Log in with `demo@sweety.test` and password `demo1234`. Running it again replaces the demo user's readings. It does not affect other users.

## Run the app

The server and the client each need their own terminal.

**Server** (API at http://localhost:5000):

```
cd server
npm run dev
```

**Client** (open http://localhost:5173 in your browser):

```
cd client
npm run dev
```

## Passwords

- **Forgot password:** click **Forgot password?** on the login page and enter your email. This demo doesn't send email, so the reset link is printed in the server's terminal. Open it within 30 minutes. Each link works only once.
- **Change password:** when logged in, open **Password** in the top menu. You'll need your current password.

## Tests

The client has tests for the reading form, written with React Testing Library and run with Vitest. They use a fake API, so the server and database don't need to be running.

```
cd client
npm test
```

They check that the form:

- opens with the right time slot
- rejects empty, decimal and out-of-range values without calling the server
- saves a valid reading and closes
- shows server errors and stays open
- edits an existing reading
- closes without saving when you click Cancel
