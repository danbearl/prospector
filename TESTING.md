# Regression Testing Documentation

This document provides instructions for running the regression tests located in the `backend/__tests__/` directory.

## Overview

The test suite includes comprehensive regression tests for:
- **Authentication** (`auth.test.js`) - User registration, login, and token verification
- **API Endpoints** (`api.test.js`) - Companies, contacts, and user data isolation

**Note**: Tests are designed to run on the host machine (not inside Docker containers). This allows for faster test execution and easier debugging during development.

## Prerequisites

Before running the tests, ensure you have:

1. **Node.js** installed (v16 or higher recommended)
2. **npm** package manager
3. Backend dependencies installed on your host machine

## Installation

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

This will install all required dependencies including:
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `sqlite3` - In-memory database for testing
- Other production dependencies

## Running Tests

### Run All Tests

To run the complete test suite:

```bash
cd backend
npm test
```

This command will:
- Execute all test files in `__tests__/` directory
- Generate a coverage report
- Display test results in the terminal

### Run Tests in Watch Mode

For development, you can run tests in watch mode (automatically re-runs on file changes):

```bash
cd backend
npm run test:watch
```

### Run Specific Test File

To run only authentication tests:

```bash
cd backend
npx jest __tests__/auth.test.js
```

To run only API tests:

```bash
cd backend
npx jest __tests__/api.test.js
```

### Run Tests with Verbose Output

For detailed test output:

```bash
cd backend
npx jest --verbose
```

## Test Structure

### Authentication Tests (`auth.test.js`)

Tests the authentication system including:

**Registration Tests:**
- ✓ Successful user registration
- ✓ Password length validation (minimum 6 characters)
- ✓ Required field validation
- ✓ Duplicate username prevention

**Login Tests:**
- ✓ Successful login with valid credentials
- ✓ Rejection of incorrect passwords
- ✓ Rejection of non-existent users
- ✓ Required field validation

**Token Verification Tests:**
- ✓ Valid token verification
- ✓ Rejection of missing tokens
- ✓ Rejection of invalid tokens

### API Endpoint Tests (`api.test.js`)

Tests the REST API endpoints including:

**Companies API Tests:**
- ✓ Create new company
- ✓ Get all companies for authenticated user
- ✓ Update company information
- ✓ Delete company
- ✓ 404 error for non-existent companies
- ✓ Authentication requirement enforcement

**Contacts API Tests:**
- ✓ Create new contact
- ✓ Get all contacts for authenticated user
- ✓ Authentication requirement enforcement

**User Isolation Tests:**
- ✓ Users cannot see other users' companies
- ✓ Users cannot update other users' companies
- ✓ Users cannot delete other users' companies

## Understanding Test Results

### Successful Test Run

```
PASS  __tests__/auth.test.js
PASS  __tests__/api.test.js

Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        2.5s
```

### Failed Test Example

```
FAIL  __tests__/auth.test.js
  ● Authentication Tests › POST /api/auth/register › should register a new user successfully

    expect(received).toBe(expected)

    Expected: 201
    Received: 500
```

## Coverage Report

The test suite generates a coverage report showing:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of code lines executed

Coverage report is displayed in the terminal after running `npm test`.

## Test Database

Tests use an **in-memory SQLite database** that:
- Is created fresh for each test suite
- Does not affect production or development databases
- Is automatically cleaned up after tests complete
- Provides fast, isolated test execution

## Troubleshooting

### Tests Fail to Run

**Issue**: `Cannot find module 'jest'`
**Solution**: Install dependencies with `npm install`

**Issue**: `Port already in use`
**Solution**: Tests use in-memory database and don't require a running server

### Tests Timeout

**Issue**: Tests hang or timeout
**Solution**: 
- Ensure no other processes are blocking resources
- Check that all async operations in tests properly resolve
- Increase Jest timeout if needed: `jest.setTimeout(10000)`

### Coverage Not Generated

**Issue**: No coverage report displayed
**Solution**: Run with explicit coverage flag: `npx jest --coverage`

## Continuous Integration

To integrate tests into CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    cd backend
    npm install
    npm test
```

## Best Practices

1. **Run tests before committing** - Ensure all tests pass before pushing code
2. **Write tests for new features** - Maintain test coverage for new functionality
3. **Keep tests isolated** - Each test should be independent and not rely on others
4. **Use descriptive test names** - Clearly describe what each test validates
5. **Mock external dependencies** - Tests use in-memory database to avoid external dependencies

## Test Configuration

Jest configuration is defined in `backend/package.json`:

```json
"jest": {
  "testEnvironment": "node",
  "coveragePathIgnorePatterns": ["/node_modules/"],
  "testMatch": ["**/__tests__/**/*.test.js"]
}
```

## Additional Commands

### Clear Jest Cache

If experiencing issues with cached test results:

```bash
cd backend
npx jest --clearCache
```

### Run Tests with Specific Pattern

To run tests matching a specific pattern:

```bash
cd backend
npx jest --testNamePattern="should register"
```

### Generate HTML Coverage Report

For a detailed HTML coverage report:

```bash
cd backend
npx jest --coverage --coverageReporters=html
```

Then open `backend/coverage/index.html` in a browser.

## Support

For issues or questions about the test suite:
1. Check test output for specific error messages
2. Review test files for expected behavior
3. Ensure all dependencies are properly installed
4. Verify Node.js version compatibility

---

**Note**: These tests are designed to validate the core functionality of the Prospector application's backend API and authentication system. They provide confidence that changes to the codebase don't break existing functionality.