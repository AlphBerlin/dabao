// Extend the default timeout for gRPC tests
jest.setTimeout(30000);

// Global setup for all tests
beforeAll(() => {
  // Set environment variables for testing
  process.env.GRPC_SERVER_URL = process.env.GRPC_SERVER_URL || 'localhost:50051';
  
  console.log(`Using gRPC server at ${process.env.GRPC_SERVER_URL}`);
  console.log('Starting test suite...');
});

// Global teardown after all tests
afterAll(() => {
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