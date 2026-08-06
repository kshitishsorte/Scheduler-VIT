# Scheduler VIT

A month calendar you can throw tasks at. Drag across a few days to put the same
thing on each one, drag a task to move it, click a date to open that day.

Two halves:

- `client/` is React 18 and TypeScript on Vite
- `server/` is Express and TypeScript over MongoDB, through Mongoose

The look comes from the Modernist design system: Archivo everywhere, no rounded
corners anywhere, 2px rules, one red accent used sparingly. Every token lives in
`client/src/styles/modernist.css`. Change them there rather than dropping a hex
into a component, or the next person retunes the palette and wonders why one
button refused to move.

## Running it

```bash
npm install
```

```bash
npm run dev
```

API on port 5000, client on 5173. The client proxies `/api` across, which keeps
the session cookie first-party while you develop.

### Database

If `MONGODB_URI` is not set, the server spins up a throwaway in-memory MongoDB so
a fresh clone runs with nothing installed. Two catches: the first run downloads
about 600 MB of MongoDB binary, and your data is gone the moment you restart.

For data that sticks around, copy `server/.env.example` to `server/.env` and
point it somewhere real:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/scheduler-vit
```

### Before you deploy

Under `NODE_ENV=production` the server refuses to start without `MONGODB_URI` and
a `JWT_SECRET` of at least 32 characters. That refusal is deliberate. The
development fallback secret is sitting in this repo, so anything running on it
can have its sessions forged by whoever reads the source.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If the client and API end up on different domains, the `sameSite: "lax"` cookie
in `server/src/lib/token.ts` will not survive the trip. Switch it to `"none"`
with `secure: true`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Both halves, watching |
| `npm run dev:server`, `npm run dev:client` | One at a time |
| `npm run check` | Calendar maths, input rules, span editing |
| `npm run typecheck` | Types only, no output |
| `npm run build` | Typecheck and build both |

## API

Everything under `/api/tasks` needs a session and only ever sees rows belonging
to its own owner. Hand it someone else's task id and you get a 404, not their
data.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account, sets the session cookie |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Clear the session |
| `GET` | `/api/auth/me` | Restore a session on page load |
| `GET` | `/api/tasks?from=&to=` | Tasks in a `YYYY-MM-DD` range |
| `POST` | `/api/tasks` | Create one |
| `POST` | `/api/tasks/bulk` | Create many, used by drag-across-days |
| `PATCH` | `/api/tasks/:id` | Update |
| `DELETE` | `/api/tasks/:id` | Delete |

### What a task looks like

```ts
{ id, title, date: "YYYY-MM-DD", time: "HH:MM" | "", priority: "high" | "normal", done: boolean }
```

`date` is a string, not a `Date`. A task on the 10th should be on the 10th
wherever you happen to be sitting, and storing an instant means it slides a day
for anyone far enough east or west. ISO strings sort chronologically as a bonus,
so a date range is an ordinary string comparison.

`done` is its own field rather than a third priority value. Mark a priority task
done, undo it, and it goes back to being a priority instead of quietly demoting
itself to normal.

### Input rules

Both sides check the same things. The client so you find out while you are still
looking at the field, the server because a client can always be bypassed.

Times are 24 hour: hours 00 to 23, minutes 00 to 59. Shorthand works, so `9`
becomes 09:00, `930` becomes 09:30, `2145` becomes 21:45. Anything out of range
gets an error beside the field instead of being silently wiped, which is what the
first version did.

Titles are required and capped at 200 characters. Passwords run 8 to 128, names
up to 60, and emails have to look like emails. Dates have to be real ones:
`2026-02-30` is rejected, and so is `2026-02-29`, because 2026 is not a leap
year.

### Editing a dragged span

Dragging across days makes one task per day. The editor that opens straight
afterwards stands for the whole span, so a time typed there lands on every day of
it. The popover admits as much with a `×3` badge and a `Save ×3` button. Click a
single chip later and you are editing only that one.

## What this replaced

The previous version was a Create React App project whose auth did not work at
all. Passwords went into the database as plaintext. Login looked users up by
password and ignored the email completely, so any password matching anyone at all
logged you in as them. The endpoint answered with success no matter what
happened, and the frontend decided you were signed in by string-matching that
reply. Tasks lived in `localStorage`, so they were never attached to an account.

The calendar had its own troubles. The grid was hard-coded to five weeks, so any
month spanning six quietly lost its last days. Navigation pinned the year to the
current one, which meant paging past December put you back in January of the same
year.

Reasons behind the security decisions are written next to the code that makes
them, in `server/src/routes/auth.routes.ts`, `server/src/lib/token.ts`, and
`server/src/middleware/requireAuth.ts`.
