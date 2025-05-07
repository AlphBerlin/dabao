// filepath: /Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/da-assistent/test/setupTests.js
const { startServer, stopServer } = require('./mockServer');

// Start the mock server before all tests
beforeAll(async () => {
  try {
    console.log('Starting mock gRPC server for tests...');
    await startServer();
  } catch (error) {
    console.error('Failed to start mock gRPC server:', error);
    throw error;
  }
});

// Shut down the mock server after all tests
afterAll(async () => {
  try {
    console.log('Stopping mock gRPC server...');
    await stopServer();
  } catch (error) {
    console.error('Error stopping mock gRPC server:', error);
  }
});

// Add a global fail function that can be used by tests
global.fail = (message) => {
  throw new Error(message);
};