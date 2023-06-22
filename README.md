# bitespeed-backend-assignment

## Local development

1. Bring up a local Postgres instance by running
   ```
   docker compose up
   ```
2. Apply database migrations by running
   ```
   npx prisma migrate dev
   ```
3. Run the Nest App
   ```
   npm start
   ```
4. Go to http://localhost:3000/api to open swagger   