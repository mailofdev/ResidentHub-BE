# Quick Start Guide

Get up and running with ResidentHub Backend in 5 minutes!

## ⚡ Fast Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/residenthub?schema=public"
JWT_SECRET="change-this-to-a-random-32-character-string"
PORT=4001
NODE_ENV=development
```

**Quick JWT Secret Generator:**
```bash
# Linux/Mac
openssl rand -base64 32

# Or use an online generator
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE residenthub;

# Exit
\q
```

### 4. Setup Database

```bash
npm run db:setup
```

### 5. Start Server

```bash
npm run start:dev
```

### 6. Verify It's Working

- **API**: http://localhost:4001
- **Swagger Docs**: http://localhost:4001/api
- **Health Check**: http://localhost:4001 (should return "Hello World!")

## 🧪 Test the API

### 1. Register an Admin

```bash
curl -X POST http://localhost:4001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "Test123!"
  }'
```

Copy the `accessToken` from the response.

### 2. Get Your Profile

```bash
curl -X GET http://localhost:4001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If you see your user profile, everything is working! ✅

## 📚 Next Steps

1. **Explore API**: Visit http://localhost:4001/api for interactive documentation
2. **Read Full Guide**: See [README.md](./README.md) for complete documentation
3. **Database Management**: Use `npm run db:studio` for visual database editing

## 🆘 Having Issues?

### Database Connection Failed?
- Make sure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` is correct
- Verify database exists: `psql -U postgres -l`

### Port Already in Use?
- Change `PORT` in `.env` file
- Or kill the process: `lsof -ti:4001 | xargs kill -9`

### Need Help?
- Check [Troubleshooting](./README.md#-troubleshooting) section
- Review [Full Documentation](./README.md)

---

**That's it! You're ready to build! 🚀**

