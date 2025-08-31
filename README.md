# Meta Software Project Management - Frontend

React + Vite app styled with TailwindCSS. Connects to the Meta Backend at <https://meta-backend-hqm9.onrender.com>.

Features:

- Auth (login/register) with roles
- Dashboard with project progress
- Projects list and create
- Tasks board grouped by status with priority/deadline
- Users list

Requirements:

- Node.js 18+ (tested with 20.11)

Scripts:

- dev: start local server
- build: production build
- preview: preview build

Environment:

- API base is hardcoded in `src/services/api.js` as `https://meta-backend-hqm9.onrender.com`.

Troubleshooting:

- If Tailwind classes don’t apply in dev, ensure PostCSS plugins are installed and restart dev server.
