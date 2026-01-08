# Enabling Google Authentication in Supabase

The error `Unsupported provider: provider is not enabled` means you need to enable Google Login in your Supabase dashboard.

## Step 1: Get Google Cloud Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for "APIs & Services" and go to **OAuth consent screen**.
   - Select **External** and click **Create**.
   - Fill in the required app information (App name, Support email, etc.) and Save.
4. Go to **Credentials** (left sidebar).
   - Click **+ Create Credentials** -> **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Supabase Auth`.
   - **Authorized redirect URIs**: 
     - You need your Supabase Project URL.
     - Add: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
     - (You can find this URL in Supabase Dashboard -> Authentication -> Providers -> Google -> Callback URL).
   - Click **Create**.
   - Copy the **Client ID** and **Client Secret**.

## Step 2: Enable Google Provider in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Authentication** (icon on the left) -> **Providers**.
4. Click on **Google**.
5. Toggle **Enable Google** to ON.
6. Paste the **Client ID** and **Client Secret** you got from Google Cloud.
7. Click **Save**.

## Step 3: Add Redirect URL (Vercel)
1. Go to **Authentication** -> **URL Configuration**.
2. Under "Site URL", ensure it points to your production site (e.g., `https://track-it4.vercel.app/`).
3. Under "Redirect URLs", add:
   - `http://localhost:8080` (for local development)
   - `https://track-it4.vercel.app/` (for production)
   - `https://track-it4.vercel.app/student/dashboard`

Once you save these changes, the Google Login button should work perfectly!
