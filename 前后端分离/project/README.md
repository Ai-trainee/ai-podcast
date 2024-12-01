# Podcast API

A Node.js backend API service for podcast management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a .env file in the root directory and add:
```
PORT=3000
NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start`: Run the server in production mode
- `npm run dev`: Run the server in development mode with hot reload

## API Endpoints

- GET `/`: Welcome message

## Technologies Used

- Node.js
- Express
- CORS
- Morgan (logging)
- dotenv
