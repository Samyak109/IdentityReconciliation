# bitespeed-backend-assignment

## Local development
### Prerequisites - 
* docker
* node 18.0+

1. Install dependencies
   ```
   npm i
   ```

2. Start a local Postgres container by running
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
