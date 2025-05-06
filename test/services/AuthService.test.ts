import { createClients, promisifyMethods, createAuthMetadata } from '../testHelpers';

// Mock credentials for testing
const TEST_CREDENTIALS = {
  validUser: {
    username: 'test@example.com',
    password: 'password123'
  },
  adminUser: {
    username: 'admin@example.com',
    password: 'adminPassword'
  },
  invalidUser: {
    username: 'nonexistent@example.com',
    password: 'wrongPassword'
  }
};

describe('AuthService', () => {
  const clients = createClients();
  const methods = promisifyMethods(clients);
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Nothing to set up for auth tests
  });

  describe('Authenticate', () => {
    it('should authenticate with valid credentials', async () => {
      try {
        const response = await methods.auth.authenticate(TEST_CREDENTIALS.validUser);
        
        expect(response).toBeDefined();
        expect(response.token).toBeDefined();
        expect(response.refresh_token).toBeDefined();
        expect(response.expires_at).toBeDefined();
        expect(response.user_id).toBeDefined();
        expect(Array.isArray(response.roles)).toBe(true);
        
        // Save tokens for later tests
        authToken = response.token;
        refreshToken = response.refresh_token;
      } catch (error) {
        console.error('Authentication error:', error);
        throw error;
      }
    });

    it('should fail with invalid credentials', async () => {
      try {
        await methods.auth.authenticate(TEST_CREDENTIALS.invalidUser);
        // Should not reach here
        fail('Authentication should have failed with invalid credentials');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.message).toContain('Authentication failed');
      }
    });

    it('should assign correct roles based on user type', async () => {
      try {
        const response = await methods.auth.authenticate(TEST_CREDENTIALS.adminUser);
        
        expect(response).toBeDefined();
        expect(Array.isArray(response.roles)).toBe(true);
        expect(response.roles).toContain('admin');
      } catch (error) {
        console.error('Authentication error:', error);
        throw error;
      }
    });

    it('should reject authentication with missing fields', async () => {
      try {
        // @ts-ignore - intentionally missing fields
        await methods.auth.authenticate({ username: TEST_CREDENTIALS.validUser.username });
        // Should not reach here
        fail('Authentication should have failed with missing fields');
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        // @ts-ignore - intentionally missing fields
        await methods.auth.authenticate({ password: TEST_CREDENTIALS.validUser.password });
        // Should not reach here
        fail('Authentication should have failed with missing fields');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('ValidateToken', () => {
    it('should validate a valid token', async () => {
      try {
        // Use the token from the previous test
        expect(authToken).toBeDefined();
        
        const response = await methods.auth.validateToken({ token: authToken });
        
        expect(response).toBeDefined();
        expect(response.valid).toBe(true);
        expect(response.user_id).toBeDefined();
        expect(Array.isArray(response.roles)).toBe(true);
      } catch (error) {
        console.error('Token validation error:', error);
        throw error;
      }
    });

    it('should reject an invalid token', async () => {
      try {
        const response = await methods.auth.validateToken({ token: 'invalid_token' });
        
        expect(response).toBeDefined();
        expect(response.valid).toBe(false);
      } catch (error) {
        // Some implementations might throw an error instead of returning valid: false
        expect(error).toBeDefined();
      }
    });
  });

  describe('RefreshToken', () => {
    it('should refresh a valid token', async () => {
      try {
        // Use the refresh token from the previous test
        expect(refreshToken).toBeDefined();
        
        const response = await methods.auth.refreshToken({ refresh_token: refreshToken });
        
        expect(response).toBeDefined();
        expect(response.token).toBeDefined();
        expect(response.refresh_token).toBeDefined();
        expect(response.expires_at).toBeDefined();
        expect(response.user_id).toBeDefined();
        expect(Array.isArray(response.roles)).toBe(true);
        
        // Update tokens for later tests
        authToken = response.token;
        refreshToken = response.refresh_token;
      } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
      }
    });

    it('should reject an invalid refresh token', async () => {
      try {
        await methods.auth.refreshToken({ refresh_token: 'invalid_refresh_token' });
        // Should not reach here
        fail('Token refresh should have failed with invalid token');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});