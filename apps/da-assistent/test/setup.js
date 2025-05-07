// Extend the default timeout for gRPC tests
jest.setTimeout(30000);

// Import mock server
const { startServer, stopServer, PORT } = require('./mockServer');

// Start mock gRPC server before all tests
beforeAll(async () => {
  console.log(`Using gRPC server at localhost:${PORT}`);
  console.log('Starting test suite...');
  try {
    await startServer();
  } catch (error) {
    console.error('Error starting mock server:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  console.log('Shutting down mock server...');
  try {
    await stopServer();
    console.log('Mock server shut down');
  } catch (error) {
    console.error('Error stopping mock server:', error);
  }
  console.log('All tests completed.');
});

// Add custom matchers if needed
expect.extend({
  // Example of a custom matcher if needed in the future
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});