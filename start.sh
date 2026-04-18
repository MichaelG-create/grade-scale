#!/bin/sh

# On s'assure que la base de données est à jour
echo "🚀 Running database migrations..."
npx prisma migrate deploy

# On démarre l'application
echo "🟢 Starting the application..."
npm start
