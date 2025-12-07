# Deployment Guide - Vercel & Render

This guide will help you deploy the RFP Management System with:
- **Frontend** on Vercel
- **Backend** on Render

---

## 📋 Prerequisites

Before deploying, ensure you have:
- GitHub account
- Vercel account (free): https://vercel.com/signup
- Render account (free): https://render.com/register
- MongoDB Atlas cluster (already set up)
- Google Gemini API key
- Gmail App Password (for email features)

---

## 🚀 Part 1: Deploy Backend on Render

### Step 1: Prepare for Deployment

Your backend is already configured for Render with:
- ✅ Environment variable support
- ✅ Dynamic PORT configuration
- ✅ CORS setup
- ✅ MongoDB Atlas connection

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - RFP Management System"

# Create repository on GitHub, then:
git remote add origin https://github.com/your-username/rfp-management-system.git
git branch -M main
git push -u origin main
```

### Step 3: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Settings:**
- **Name:** `rfp-management-backend` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Step 4: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rfp-management?retryWrites=true&w=majority
GEMINI_API_KEY=your-gemini-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

**Important:**
- Replace all values with your actual credentials
- `FRONTEND_URL` will be added after deploying frontend

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Your backend URL will be: `https://rfp-management-backend.onrender.com` (or your chosen name)
4. **Save this URL** - you'll need it for the frontend!

### Step 6: Test Backend

Visit: `https://your-backend-url.onrender.com/api/health`

You should see:
```json
{
  "success": true,
  "message": "RFP Management System API is running",
  "timestamp": "2025-12-07T..."
}
```

---

## 🌐 Part 2: Deploy Frontend on Vercel

### Step 1: Prepare Frontend

Your frontend is already configured with:
- ✅ `vercel.json` configuration
- ✅ Dynamic API URL support
- ✅ Build script

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Choose your account
- Link to existing project? **No**
- Project name? `rfp-management-frontend` (or your choice)
- Directory? `./` (current directory)
- Override settings? **No**

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### Step 3: Add Environment Variables in Vercel

In Vercel project settings → **Environment Variables**, add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url.onrender.com` with your actual Render backend URL.

### Step 4: Redeploy

After adding environment variables:
- Click **"Redeploy"** in Vercel dashboard
- Or run `vercel --prod` in terminal

### Step 5: Get Frontend URL

Your frontend will be at: `https://your-app-name.vercel.app`

---

## 🔄 Part 3: Update Backend with Frontend URL

### Step 1: Update Render Environment

1. Go to Render dashboard → Your backend service
2. Go to **Environment** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## ✅ Part 4: Verify Deployment

### Test Frontend
1. Visit: `https://your-app-name.vercel.app`
2. You should see the dashboard
3. Try creating an RFP
4. Check browser console for any errors

### Test Backend
1. Visit: `https://your-backend-url.onrender.com/api/health`
2. Should return success message

### Test API Connection
1. In frontend, try to create a vendor
2. Check if it saves to database
3. Verify RFP creation works

---

## 🐛 Troubleshooting

### CORS Errors
**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS`

**Solution:**
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Redeploy backend on Render
3. Clear browser cache

### API Connection Failed
**Error:** `Network Error` or `Failed to fetch`

**Solution:**
1. Check `REACT_APP_API_URL` in Vercel is correct
2. Verify backend is running: visit `/api/health` endpoint
3. Check browser console for exact error

### Environment Variables Not Working
**Solution:**
1. In Vercel: Redeploy after adding env vars
2. In Render: Check "Auto-Deploy" is enabled
3. Verify no typos in variable names

### MongoDB Connection Failed (Render)
**Error:** `MongooseServerSelectionError`

**Solution:**
1. Check MongoDB Atlas network access allows all IPs (0.0.0.0/0)
2. Verify `MONGODB_URI` is correct in Render
3. Check MongoDB Atlas user has correct permissions

### Render Free Tier Sleep
**Issue:** Backend sleeps after 15 min of inactivity

**Solution:**
- Free tier limitation - backend takes 30-60s to wake up
- Consider upgrading to paid tier for always-on
- Or use a service like UptimeRobot to ping every 14 minutes

---

## 📊 Monitoring

### Render Logs
- Go to Render dashboard → Your service → **Logs**
- View real-time server logs
- Check for errors during requests

### Vercel Analytics
- Go to Vercel dashboard → Your project → **Analytics**
- View page views, performance
- Check deployment status

---

## 🔄 Future Deployments

### Updating Backend
```bash
# Make changes
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

### Updating Frontend
```bash
# Make changes
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

Or use: `vercel --prod` for manual deployment

---

## 📝 Production Checklist

Before going live, ensure:

**Security:**
- [ ] Environment variables are set correctly
- [ ] No API keys in code
- [ ] CORS configured for specific frontend URL
- [ ] MongoDB Atlas network access configured

**Functionality:**
- [ ] All API endpoints working
- [ ] Frontend connects to backend
- [ ] Database operations successful
- [ ] Email features working (if configured)

**Performance:**
- [ ] Frontend builds without errors
- [ ] Backend starts successfully
- [ ] MongoDB queries are optimized

---

## 🌐 Your Deployed URLs

After deployment, update these in your README:

**Frontend (Vercel):** `https://your-app-name.vercel.app`  
**Backend (Render):** `https://your-backend-name.onrender.com`  
**API Base URL:** `https://your-backend-name.onrender.com/api`

---

## 💡 Tips

1. **Free Tier Limitations:**
   - Render: Backend sleeps after 15 min inactivity
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage

2. **Custom Domain:**
   - Vercel: Add custom domain in project settings
   - Render: Available on paid plans

3. **HTTPS:**
   - Both Vercel and Render provide free SSL certificates
   - Your app is automatically served over HTTPS

4. **Scaling:**
   - Both platforms offer easy scaling
   - Upgrade to paid plans for better performance

---

**Congratulations! Your app is now live! 🎉**
