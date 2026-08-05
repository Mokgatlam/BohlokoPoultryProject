# GitHub Pages Deployment Guide

This guide explains how to deploy the Bohloko Family Farm frontend to GitHub Pages.

## Prerequisites

- GitHub repository: https://github.com/Mokgatlam/BohlokoPoultryProject.git
- Admin access to the repository settings

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/Mokgatlam/BohlokoPoultryProject
2. Click **Settings** tab
3. In the left sidebar, click **Pages**
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
5. Save settings

### 2. Configure Repository Permissions

1. In **Settings**, go to **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Enable: **Read and write permissions**
4. Enable: **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Push the Deployment Configuration

The following files have been added to enable GitHub Pages deployment:

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `.nojekyll` - Disables Jekyll processing

Commit and push these files:

```bash
git add .github/workflows/deploy.yml .nojekyll
git commit -m "Add GitHub Pages deployment configuration"
git push origin main
```

### 4. Monitor Deployment

After pushing, GitHub Actions will automatically deploy your site:

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see a workflow run named "Deploy to GitHub Pages"
4. Wait for it to complete (usually 1-2 minutes)
5. Once complete, your site will be live at:

```
https://mokgatlam.github.io/BohlokoPoultryProject/
```

## Important Notes

### Static Site Limitations

GitHub Pages hosts **static files only**. This means:

**What works:**
- Public-facing pages (homepage, shop, about, contact)
- Static content and images
- Bootstrap/JavaScript interactions
- Service worker for offline caching

**What doesn't work:**
- Backend API routes (Node.js server)
- Database operations (NeDB)
- User authentication (login/signup)
- Dynamic order processing
- Payment processing

### Handling Backend Features

For full functionality, you have two options:

#### Option 1: Mock Data (Recommended for Demo)

The frontend can display static mock data for demonstration purposes.

#### Option 2: Separate Backend Hosting

Host the backend separately on:
- **Render** (render.com) - Free tier available
- **Railway** (railway.app) - Free tier with $5 credit
- **Fly.io** - Free tier available

Then update API endpoints in `assets/js/api.js` to point to your hosted backend.

### File Structure

Your public pages are located in:
```
pages/
├── public/           # Customer-facing pages
│   ├── index.html    # Homepage
│   ├── shop.html     # Product listings
│   ├── about.html    # About page
│   ├── contact.html  # Contact page
│   ├── login.html    # Login (static version)
│   ├── signup.html   # Sign up (static version)
│   ├── orders.html   # Orders (static version)
│   └── 404.html      # 404 error page
├── dashboard/        # Dashboard pages (require auth)
├── admin/            # Admin pages (require auth)
└── staff/            # Staff pages (require auth)
```

GitHub Pages will serve the entire repository as static files.

## Troubleshooting

### Pages Not Loading

1. Check the **Actions** tab for deployment errors
2. Ensure `.nojekyll` file exists in the root directory
3. Verify all file paths in HTML use relative paths (not absolute)

### 404 Errors on Refresh

GitHub Pages doesn't support server-side routing. If you refresh a subpage:
- It may show a 404 error
- Solution: Add a custom 404.html page (already included)

### Images Not Loading

- Ensure images are in the `assets/images/` directory
- Use relative paths like `../../assets/images/products/whole-chicken.png`

## Updating the Site

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Rebuild the site
2. Deploy the latest version
3. Update the live URL within 1-2 minutes

No manual intervention required!

## Custom Domain (Optional)

To use a custom domain like `bohlokofarm.co.za`:

1. In repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Update your domain's DNS settings:
   - Add an A record pointing to GitHub's IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or add a CNAME record pointing to `mokgatlam.github.io`

## Live URL

Once deployed, your site will be available at:

**GitHub Pages URL:**
```
https://mokgatlam.github.io/BohlokoPoultryProject/
```

## Next Steps

1. Enable GitHub Pages in repository settings
2. Push the deployment files
3. Wait for deployment to complete
4. Visit your live site
5. Share the URL with stakeholders

For backend functionality, consider deploying the Node.js server separately using Render or Railway.