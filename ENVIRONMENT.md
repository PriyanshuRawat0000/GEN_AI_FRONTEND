# Environment Configuration Guide

This project uses MongoDB for data storage and Cloudflare R2 for image storage. Follow this guide to set up your environment.

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in your MongoDB URI and Cloudflare R2 credentials
3. Generate a secure JWT_SECRET
4. Run `npm install` and `npm run dev`

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username and password
4. Get your connection string (click "Connect" > "Drivers")
5. Add your IP to the IP Whitelist
6. Paste the connection string into `MONGODB_URI`

Example URI:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&appName=llm-comparison
```

### Option 2: Local MongoDB (For Development)

1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/
2. Start MongoDB: `mongod`
3. Use local URI: `mongodb://localhost:27017`

## Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 > Create bucket > name it "llm-comparison"
3. Create an API token:
   - Go to "Account Details" > "API Tokens" > "Create Token"
   - Set permissions: "Object Read & Write" for your bucket
   - Copy the credentials:
     - Account ID: Found in R2 overview
     - Access Key ID: From the API token
     - Secret Access Key: From the API token
4. Create a public R2 custom domain or use the default public URL
5. Fill in your R2 credentials in `.env.local`

Example R2 values:
```
R2_ACCOUNT_ID=abc123def456
R2_ACCESS_KEY_ID=12345678901234567890
R2_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz123456
R2_BUCKET_NAME=llm-comparison
R2_PUBLIC_BASE=https://pub-abc123def456.r2.dev
```

## JWT Secret Generation

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `JWT_SECRET` in your `.env.local`

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB` | Database name | `llm-comparison` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `abc123def456` |
| `R2_ACCESS_KEY_ID` | R2 API access key | `12345678901234567890` |
| `R2_SECRET_ACCESS_KEY` | R2 API secret key | `abcdefghij...` |
| `R2_BUCKET_NAME` | R2 bucket name | `llm-comparison` |
| `R2_PUBLIC_BASE` | Public R2 URL base | `https://pub-abc123.r2.dev` |
| `JWT_SECRET` | JWT signing secret | `abc123def456...` |
| `NODE_ENV` | Environment | `development` or `production` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3000` |

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - Add all variables from `.env.production`
   - Vercel will automatically use `NEXT_PUBLIC_*` variables on the client
5. Deploy

## Data Isolation & Security

- **JWT Tokens**: All API requests require valid JWT tokens. Tokens expire after 7 days.
- **MongoDB ObjectIds**: Images and ratings use MongoDB's native ObjectId type for data integrity
- **User Validation**: Every API route validates the authenticated user before operations
- **Rating Isolation**: Users can only see and modify their own ratings
- **Image Upload**: All images are uploaded to R2 and validated before storage

## Troubleshooting

### MongoDB Connection Failed
- Check your connection string is correct
- Verify your IP is whitelisted in MongoDB Atlas
- Ensure credentials are URL-encoded (e.g., `@` becomes `%40`)

### R2 Upload Failed
- Check your credentials are correct
- Verify the bucket exists
- Ensure your API token has proper permissions

### JWT Token Invalid
- Ensure JWT_SECRET is set correctly
- Check token hasn't expired (7 days)
- Verify you're sending token in Authorization header: `Bearer <token>`
```
</parameter>
