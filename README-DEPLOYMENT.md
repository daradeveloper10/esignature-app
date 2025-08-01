# Deployment Instructions

## What I've Done For You:
1. ✅ Built your application (`npm run build`)
2. ✅ Created `netlify.toml` configuration file
3. ✅ Set up proper redirects for your React Router

## What You Need To Do:

### Step 1: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/log in
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `dist` folder that was just created
4. Your site will get a random URL like `https://amazing-name-123456.netlify.app`

### Step 2: Update Environment Variables
1. In your Netlify dashboard, go to: **Site settings** → **Environment variables**
2. Add these variables:
   - `VITE_SUPABASE_URL`: `https://zsmdsjgcevqsfmaxmqnh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbWRzamdjZXZxc2ZtYXhtcW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTY1NzIsImV4cCI6MjA2ODc3MjU3Mn0.jVqmICzT-gT91gqeXyecmBS3VrWfZN-ON2af7uBImu8`
   - `VITE_PUBLIC_APP_URL`: `https://your-actual-netlify-url.netlify.app` (replace with your real URL)

### Step 3: Redeploy
1. After setting environment variables, trigger a new deployment
2. You can do this by going to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 4: Test
1. Visit your deployed site
2. Send a signature request
3. Check that the email links now point to your public URL instead of localhost

## Alternative: Automatic Deployment
If you have your code in GitHub, you can:
1. Connect your GitHub repo to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist`
4. Add the environment variables as described above