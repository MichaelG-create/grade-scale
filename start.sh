#!/bin/sh

# On s'assure que la base de données est à jour
echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
node dist/prisma/seed.js

# On démarre l'application
echo "🟢 Starting the application..."
npm start
