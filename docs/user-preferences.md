# User Preferences Implementation

This document outlines the implementation of user preferences, account deletion, and data export features.

## Features Implemented

### Database Schema
- Added UserPreferences model to Prisma schema
- Created migration script for adding user preferences table

### API Endpoints
- `/api/user/preferences` - GET and PUT endpoints for managing user preferences
- `/api/user/account/delete` - DELETE endpoint for account deletion
- `/api/user/account/export` - GET endpoint for exporting user data

### User Interface
- Updated user profile page with theme selector
- Added language preference selector
- Added email notification preferences
- Implemented account deletion with confirmation dialog
- Added data export functionality

### Application Integration
- Updated UserContext to include user preferences
- Created hooks for managing theme preferences
- Ensured theme preferences are applied application-wide
- Added preference syncing between UI and API

## How to Use

### User Preferences
```typescript
// Access user preferences
const { preferences, updatePreferences } = useUser();

// Update preferences
await updatePreferences({ theme: 'dark' });

// Get current theme
const currentTheme = preferences?.theme || 'system';
```

### Theme Integration
```typescript
// Use the theme preference hook (automatically syncs)
import { useThemePreference } from '@/hooks/use-theme-preference';

// In your component
useThemePreference();
```

## Testing

To test the user preferences:
1. Run the migration: `./scripts/add-user-preferences.sh`
2. Start the application
3. Navigate to the user profile page
4. Change theme preferences and verify they apply across the app
5. Test data export and verify the JSON contains all user data
6. Test account deletion (with caution)

## Future Enhancements

1. Add more language options
2. Include timezone preferences
3. Add more notification channels (push, SMS)
4. Add profile picture upload
5. Add two-factor authentication options
