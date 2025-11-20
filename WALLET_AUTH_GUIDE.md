# Wallet-Based User Authentication System

## Overview
This system implements wallet-based user authentication with MongoDB integration. When a user connects their wallet, the system checks if they're registered in the database. If not, they're redirected to a registration page to complete their profile.

## Features

### Backend (Go/Gin)

#### API Endpoints

1. **Check Wallet Registration**
   - **Endpoint**: `POST /api/auth/wallet/check`
   - **Request Body**:
     ```json
     {
       "walletAddress": "0x..."
     }
     ```
   - **Response**:
     ```json
     {
       "exists": true/false,
       "user": {
         "id": "...",
         "email": "user@example.com",
         "name": "Username",
         "walletAddress": "0x..."
       }
     }
     ```

2. **Register Wallet User**
   - **Endpoint**: `POST /api/auth/wallet/register`
   - **Request Body**:
     ```json
     {
       "walletAddress": "0x...",
       "name": "Username",
       "email": "user@example.com"
     }
     ```
   - **Response**:
     ```json
     {
       "token": "jwt_token",
       "user": {
         "id": "...",
         "email": "user@example.com",
         "name": "Username",
         "walletAddress": "0x..."
       }
     }
     ```

#### Database Schema

The `User` model in MongoDB includes:
- `_id`: MongoDB ObjectID
- `email`: User's email address (unique)
- `name`: User's display name
- `walletAddress`: Ethereum wallet address (unique)
- `password`: Password hash (empty for wallet-based auth)

### Frontend (Next.js/React)

#### Components

1. **Registration Page** (`/app/register/page.tsx`)
   - Displays when a wallet is connected but user is not registered
   - Collects username and email
   - Redirects to intended destination after registration

2. **WalletAuthContext** (`/app/contexts/SimpleWalletContext.tsx`)
   - Manages wallet connection state
   - Checks user registration status automatically
   - Provides user data throughout the app
   - Exposes `checkUserRegistration()` method

3. **RequireRegistration Component** (`/app/components/RequireRegistration.tsx`)
   - Middleware component to protect routes
   - Redirects unregistered users to registration page

#### User Flow

1. User connects wallet via MetaMask
2. System automatically checks if wallet is registered in MongoDB
3. If registered:
   - User data is loaded into context
   - User can access all features
4. If not registered:
   - User is redirected to `/register` page
   - After completing registration, redirected to intended page

## Usage

### Starting the Application

1. **Start Backend Server**:
   ```bash
   cd server
   go run main.go
   ```
   Server runs on `http://localhost:8080`

2. **Start Frontend**:
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:3000`

3. **MongoDB Setup**:
   - Ensure MongoDB is running
   - Set `DATABASE_URL` in `.env` file
   - Database: `collabify`
   - Collection: `users`

### Environment Variables

**Server** (`.env`):
```env
DATABASE_URL=mongodb://localhost:27017
JWT_KEY=your_secret_key_here
```

**Client** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Integration with Existing Features

### WebSocket Sessions
The wallet address is still used as the user identifier in WebSocket sessions, maintaining backward compatibility.

### Document & Drawing Storage
Documents and drawings can now be associated with user profiles in addition to wallet addresses.

## Security Considerations

1. **JWT Tokens**: Generated using wallet address as identifier
2. **No Password Storage**: Wallet-based auth doesn't require passwords
3. **Unique Constraints**: Both email and wallet address must be unique
4. **Client-Side Validation**: Form validation before API calls
5. **Server-Side Validation**: All inputs validated on backend

## Future Enhancements

- [ ] Add profile editing functionality
- [ ] Implement wallet signature verification
- [ ] Add user avatar support
- [ ] Enable multiple wallet addresses per user
- [ ] Add social login options
- [ ] Implement user settings page

## Troubleshooting

### User not redirected to registration
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure MongoDB connection is active

### Registration fails
- Check if email/wallet already exists
- Verify MongoDB is running
- Check server logs for errors

### Wallet connection issues
- Ensure MetaMask is installed
- Check if wallet is unlocked
- Verify correct network is selected
