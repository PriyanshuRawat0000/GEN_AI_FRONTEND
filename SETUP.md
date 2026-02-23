# LLM Image Comparison Platform - Production Setup Guide

This is a fully production-ready LLM image comparison platform with MongoDB integration, Cloudflare R2 image storage, JWT authentication, and strict data isolation.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB instance (local or Atlas)
- Cloudflare R2 account (optional, required for image uploads)

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables in `.env.local` (see Configuration section)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## Configuration

### Environment Variables

Create a `.env.local` file with these variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=llm-comparison

# Cloudflare R2 Image Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=llm-comparison
R2_PUBLIC_BASE=https://pub-your-account-id.r2.dev

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### MongoDB Setup

#### Option 1: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free tier cluster
3. Create a database user with username and password
4. Get connection string: Cluster > Connect > Drivers
5. Add your IP to IP Whitelist
6. Paste connection string into `MONGODB_URI`

Example connection string:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&appName=llm-comparison
```

#### Option 2: Local MongoDB
1. Install MongoDB: https://docs.mongodb.com/manual/installation/
2. Start MongoDB: `mongod`
3. Use connection string: `mongodb://localhost:27017`

### Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 > Create Bucket > Name: `llm-comparison`
3. Create API token:
   - Go to Account Details > API Tokens > Create Token
   - Select R2 API permissions
   - Grant access to your bucket
4. Copy credentials:
   - Account ID: From R2 overview page
   - Access Key ID: From API token
   - Secret Access Key: From API token
5. Get public URL (optional):
   - R2 > Bucket Settings > Public R2 URL
   - Or create custom domain

### JWT Secret Generation

Generate a secure random key for `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Backend:** Next.js API Routes
- **Database:** MongoDB with native ObjectIds
- **Authentication:** JWT with bcrypt password hashing
- **Image Storage:** Cloudflare R2 (S3-compatible)
- **Styling:** Tailwind CSS + shadcn/ui

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Images Collection
```javascript
{
  _id: ObjectId,
  inputImage: String (R2 URL),
  model1Image: String (R2 URL),
  model2Image: String (R2 URL),
  prompt: String,
  createdBy: ObjectId (userId),
  model1Ratings: [
    {
      userId: ObjectId,
      stars: [0-5, 0-5, 0-5, 0-5, 0-5, 0-5],
      ratedAt: Date
    }
  ],
  model2Ratings: [...same structure...],
  createdAt: Date,
  updatedAt: Date
}
```

### API Routes

All routes require JWT authentication via `Authorization: Bearer <token>` header.

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/login` | POST | No | Create account or login |
| `/api/auth/logout` | POST | Yes | Logout (clears token) |
| `/api/user` | GET | Yes | Get authenticated user |
| `/api/images` | GET | Yes | Get all comparisons with averages |
| `/api/images/[id]` | GET | Yes | Get specific comparison |
| `/api/images/create` | POST | Yes | Create new comparison (upload to R2) |
| `/api/ratings` | POST | Yes | Save/update rating |

### Authentication Flow

1. User enters email and password on signup/login
2. API hashes password with bcrypt (if new user, creates account)
3. API generates JWT token with userId and email
4. Frontend stores token in localStorage
5. Every API call includes token in Authorization header
6. Backend verifies token signature and expiry (7 days)

### Data Isolation

- Every API validates the authenticated user's ID against request data
- Users can only see their own ratings
- Rating averages computed server-side (frontend can't manipulate)
- Images are public, but ratings are strictly user-scoped

---

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com) > Import Project
3. Select your GitHub repository
4. Add environment variables:
   - `MONGODB_URI` (production MongoDB)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`, `R2_PUBLIC_BASE`
   - `JWT_SECRET` (new secure key for production)
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://your-domain.com`
5. Click Deploy

### Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Use HTTPS for all traffic
- [ ] Enable MongoDB IP Whitelist with production IPs only
- [ ] Configure R2 CORS if needed
- [ ] Set up database backups (MongoDB Atlas default: daily)
- [ ] Monitor API error rates
- [ ] Enable rate limiting on API routes
- [ ] Test data isolation with multiple accounts
- [ ] Configure custom domain for R2 (optional)

---

## Features

### 1. Authentication
- Secure email/password signup and login
- JWT tokens valid for 7 days
- bcrypt password hashing (10 salt rounds)
- Automatic logout on token expiry

### 2. Image Comparison
- Upload input image + two model outputs
- Store with prompt and metadata
- Images uploaded to Cloudflare R2
- Side-by-side comparison view

### 3. 6-Factor Rating System
Rate each model output on 6 independent factors (0-5 stars):
1. **Quality** - Visual clarity and sharpness
2. **Accuracy** - How well it matches the prompt
3. **Detail** - Amount of fine details preserved
4. **Color** - Color correctness and vibrancy
5. **Lighting** - Lighting distribution and realism
6. **Overall** - General aesthetic appeal

### 4. Rating Data Isolation
- Each user's ratings stored separately
- Server computes averages across all users
- Users see both personal and aggregate ratings
- Can update or clear ratings anytime

### 5. Personal Testing
- Upload custom images to compare models
- Images stored in R2 with expiring signed URLs (optional)
- Full rating access for your comparisons
- Private to your account

---

## Development Workflow

### Local Testing

1. Start MongoDB locally: `mongod`
2. Run dev server: `npm run dev`
3. Create test account
4. Create sample comparisons
5. Test rating system with multiple accounts

### Database Inspection

View data in MongoDB:
```bash
# Using MongoDB Atlas UI
# Collections > users/images > click documents

# Or using mongo shell
use llm-comparison
db.users.find()
db.images.find()
```

### Testing Data Isolation

1. Create account A with email `a@example.com`
2. Create account B with email `b@example.com`
3. Both upload rating for same image
4. Verify each user only sees their own rating in UI
5. Verify `/api/images` returns different data per user

---

## Troubleshooting

### MongoDB Connection Error
- Verify connection string is correct
- Check IP is whitelisted in MongoDB Atlas
- Ensure credentials are URL-encoded (`@` → `%40`)
- Test locally first before production

### R2 Upload Fails
- Verify API credentials are correct
- Check bucket name exists
- Ensure API token has R2 permissions
- Verify bucket is not rate-limited

### Rating Not Saving
- Check browser console for errors
- Verify JWT token exists: `localStorage.getItem('auth_token')`
- Check API response status (should be 200)
- Verify user ID matches between routes

### JWT Token Expired
- Tokens expire after 7 days
- User needs to login again
- Frontend should redirect to login on 401 response

### Images Not Displaying
- Verify R2 bucket is public or CORS enabled
- Check image URLs are correct in database
- Verify R2 public base URL is correct

---

## Performance Optimization

### For Production

1. **Database Indexes** (MongoDB):
   ```javascript
   db.users.createIndex({ email: 1 }, { unique: true })
   db.images.createIndex({ createdBy: 1 })
   db.images.createIndex({ createdAt: -1 })
   ```

2. **R2 CDN Integration**: Configure Cloudflare CDN to cache images

3. **API Response Caching**: Add `Cache-Control` headers for GET endpoints

4. **Database Connection Pooling**: Already configured in `lib/db.ts`

---

## Security Best Practices

- Change JWT_SECRET for each environment
- Use HTTPS only in production
- Enable MongoDB authentication
- Use strong, unique passwords for services
- Regular database backups (daily minimum)
- Monitor API logs for suspicious activity
- Rate limit API endpoints
- Validate all inputs server-side
- Implement CORS properly (only trusted domains)
- Keep dependencies updated: `npm audit`

---

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── images/
│   │   ├── [imageId]/route.ts
│   │   ├── create/route.ts
│   │   └── route.ts
│   ├── ratings/route.ts
│   └── user/route.ts
├── dashboard/page.tsx
├── test/page.tsx
├── page.tsx
└── layout.tsx

components/
├── auth/
│   ├── login-form.tsx
│   └── signup-form.tsx
├── comparison/image-comparison.tsx
├── rating/star-rating.tsx
├── layout/header.tsx
└── ui/[shadcn components]

lib/
├── db.ts          # MongoDB operations & types
├── auth.ts        # JWT & bcrypt utilities
├── r2.ts          # Cloudflare R2 upload/delete
└── utils.ts       # General utilities
```

---

## Next Steps

1. **Configure MongoDB** - Set up Atlas or local instance
2. **Configure R2** - Get credentials and create bucket
3. **Test Locally** - Create accounts and upload comparisons
4. **Deploy to Vercel** - Push to GitHub and deploy
5. **Monitor** - Track error rates and user activity
6. **Scale** - Add more features or optimize as needed

---

## Support Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
