# Analytics Setup Guide

This guide explains how to set up analytics for your Piriapolis local guide website. Analytics will help you understand how your Airbnb guests are using the guide.

## 📊 What Insights You'll Get

### For Airbnb Hosts:
- **Guest Engagement**: See how many guests actually use the guide
- **Popular Places**: Discover which restaurants, activities, and attractions guests are most interested in
- **Navigation Preferences**: See which mapping app guests prefer (Waze, Google Maps, Apple Maps)
- **Language Usage**: Understand which language your guests prefer (ES, EN, PT)
- **Device Types**: Know if guests use mobile or desktop (important for mobile optimization)
- **Time on Site**: See how long guests spend exploring the guide
- **User Flow**: Track the journey from homepage → location → place details

### Key Metrics to Watch:
1. **Most Viewed Places** - Which recommendations are most popular?
2. **Navigation Clicks** - Are guests actually using the navigation links?
3. **Language Distribution** - Should you focus on certain languages?
4. **Mobile vs Desktop** - Is the mobile experience working well?

---

## 🎯 Recommended Tools

### Option 1: Google Analytics 4 (GA4) - **RECOMMENDED**

**Why GA4?**
- ✅ Completely free
- ✅ Most comprehensive analytics
- ✅ Industry standard
- ✅ Great for low traffic sites
- ✅ Detailed custom event tracking
- ✅ Real-time data

**Setup Steps:**

1. **Create a GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Sign in with your Google account
   - Click "Admin" → "Create Property"
   - Choose "Web" as the platform
   - Enter your website URL
   - Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

2. **Configure for Production (GitHub Pages)**
   - See the "For Production (GitHub Pages)" section below for setting up GitHub Secrets
   - This is the recommended way for production deployments

3. **Deploy**
   - The analytics code is already integrated in the app
   - After setting up GitHub Secrets, push to `main` and the workflow will automatically use them

**What You'll See in GA4:**
- Real-time visitors
- Page views and sessions
- Custom events (navigation clicks, place views, language changes)
- User demographics and device info
- Traffic sources
- User flow visualization

---

## 🔧 Configuration

### For Production (GitHub Pages) - **REQUIRED**

The workflow uses **GitHub Secrets** directly. No `.env` file is needed in production.

#### How to Set GitHub Secrets:

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO`

2. **Open Settings**
   - Click on the **Settings** tab (top menu)

3. **Go to Secrets and variables**
   - In the left sidebar, click **Secrets and variables**
   - Then click **Actions**

4. **Add your secrets**
   - Click **New repository secret**
   - Add each secret:

   **For Google Analytics 4:**
   - **Name:** `PUBLIC_GA4_MEASUREMENT_ID`
   - **Value:** Your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`)
   - Click **Add secret**

5. **Done!**
   - The next time you push to `main`, the workflow will automatically use these secrets
   - The build step will have access to these environment variables

**Visual Guide:**
```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

**Important Notes:**
- GitHub Secrets are encrypted and only available during workflow runs
- They're never exposed in logs or the repository
- `PUBLIC_*` variables are safe to expose (they're bundled into client-side code anyway)
- Analytics will only initialize if the Measurement ID is configured

### For Local Development (Optional)

If you want to test analytics locally, you can create a `.env` file:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your values:**
   ```bash
   # Google Analytics 4
   PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Note:** The `.env` file is only for local development. It's gitignored and won't be deployed. For production, use GitHub Secrets (see above).

---

## 📈 Tracked Events

The following user interactions are automatically tracked:

### Automatic Events:
- **Page Views** - Every page visit
- **Location Views** - When guests view a location page (e.g., Piriapolis)
- **Place Views** - When guests open a place popup
- **Marker Clicks** - When guests click a map marker
- **Language Changes** - When guests switch languages

### Navigation Events:
- **Waze Clicks** - When guests click "Waze" navigation
- **Google Maps Clicks** - When guests click "Google Maps" navigation
- **Apple Maps Clicks** - When guests click "Apple Maps" navigation
- **Instagram Clicks** - When guests click Instagram links

All events include context like:
- Place name
- Category (restaurant, activity, etc.)
- Location name

---

## 🎯 Using the Data

### For Airbnb Hosts:

1. **Check Engagement Weekly**
   - See if guests are actually using the guide
   - Low usage? Maybe mention it in your Airbnb messages

2. **Identify Popular Places**
   - Focus on recommending places that guests actually click
   - Update descriptions for places that get less attention

3. **Optimize Navigation**
   - If Waze is most popular, maybe mention it in your welcome message
   - If mobile usage is high, ensure mobile experience is great

4. **Language Insights**
   - If most guests use English, prioritize English content
   - If Spanish is popular, ensure Spanish translations are complete

5. **Track Success**
   - Compare analytics before/after sharing the guide
   - See if guide usage correlates with positive reviews

---

## 🔒 Privacy Considerations

### Google Analytics 4:
- Configured with privacy-friendly settings:
  - IP anonymization enabled
  - Google signals disabled
  - Ad personalization disabled
- Still collects some data (as per Google's privacy policy)

---

## 🚀 Quick Start

1. **Get your GA4 Measurement ID** from [Google Analytics](https://analytics.google.com/)
2. **Set up GitHub Secret** (see "For Production" section above):
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secret: `PUBLIC_GA4_MEASUREMENT_ID` with your Measurement ID
3. **Deploy** - Push to `main` branch (GitHub Actions will build and deploy automatically)
4. **Verify** - Visit your site and check the GA4 dashboard for real-time data

---

## 📝 Notes

- Analytics only work in production (or when running `npm run preview`)
- Development mode (`npm run dev`) won't send analytics events
- All tracking is automatic - no code changes needed after setup
- Events are tracked client-side only (privacy-friendly)

---

## 🆘 Troubleshooting

**Not seeing data?**
- Check that environment variables are set correctly
- Verify the Measurement ID/domain is correct
- Make sure you're viewing the production site (not localhost)
- Wait a few minutes for data to appear (real-time can take 1-2 minutes)

**Events not tracking?**
- Check browser console for errors
- Verify the analytics script is loading (check Network tab)
- Ensure you're not using an ad blocker (they can block analytics)

---

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-public)

---

**Happy tracking! 📊**
