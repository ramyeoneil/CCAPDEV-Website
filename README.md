# Tech-A-Muna — Local Setup (Node.js)

This project must be hosted using Node.js (Express). Follow these steps to run the app locally on Windows.

Prerequisites
- Node.js (16+ recommended) and npm installed
- MongoDB Community Server installed and running (local service) or a MongoDB connection URI

Steps
1. Open a terminal and change directory to the project root (the folder that contains `server.js`).
	Example (replace the path with where you cloned/downloaded the repo):
```cmd
cd C:\path\to\CCAPDEV-Website-main
```

2. Install dependencies:
```cmd
npm install (if you plan to use `npm run dev`, also install `nodemon` globally or run `npm i -D nodemon`)
```

3. Ensure MongoDB is running locally (service) or set `MONGO_URI` in a `.env` file in the project root.
- To start the local Windows service (if installed):
```cmd
net start MongoDB
```
- Or start `mongod` manually if you prefer:
```cmd
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath "C:\data\db"
```

4. Populate the database with sample data (development only):
```cmd
npm run seed
```

5. Start the Node.js server (serves both API and frontend):
```cmd
npm start
```

6. Open the app in your browser:

http://localhost:3000/index.html

Notes
- The Express server serves static files from the project root and exposes API endpoints at `/api/*` (e.g., `/api/stores`).
- If you need to use a remote MongoDB, create a `.env` file at the project root with:
```
MONGO_URI="your_connection_string_here"
```
- Use `npm run seed` only in development — it clears and inserts sample data.
