# MongoDB Connection Error Bugfix Design

## Overview

The backend server fails to connect to MongoDB Atlas due to a DNS resolution error (`querySrv ECONNREFUSED`). The current implementation in `server.js` directly calls `mongoose.connect()` without proper connection configuration and lacks a modular structure for database connection management. This design outlines a fix that creates a dedicated database configuration module (`config/db.js`) with proper error handling, uses environment variables via dotenv, and ensures the Express server only starts after successful database connection.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the server attempts to connect to MongoDB Atlas using `mongoose.connect()` with improper configuration or DNS resolution issues
- **Property (P)**: The desired behavior when the server starts - MongoDB connection should succeed, log confirmation, and then start the Express server
- **Preservation**: Existing server startup behavior, middleware configuration, route handling, and error handling that must remain unchanged by the fix
- **connectDB**: A new function in `config/db.js` that encapsulates MongoDB connection logic with proper error handling
- **mongoose.connect()**: The Mongoose method that establishes connection to MongoDB, which requires proper URI format and configuration
- **MONGO_URI**: Environment variable containing the MongoDB Atlas connection string
- **querySrv ECONNREFUSED**: DNS SRV lookup failure indicating the system cannot resolve the MongoDB cluster hostname

## Bug Details

### Bug Condition

The bug manifests when the server starts and attempts to connect to MongoDB Atlas. The `mongoose.connect()` call in `server.js` is either encountering DNS resolution issues, using an improperly formatted connection string, or lacking necessary connection options that would help with Atlas connectivity.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ServerStartupEvent
  OUTPUT: boolean
  
  RETURN input.mongoURIProvided == true
         AND input.connectionAttempted == true
         AND (input.dnsResolutionFailed == true 
              OR input.connectionStringImproperlyFormatted == true
              OR input.connectionOptionsIncomplete == true)
         AND NOT input.mongoDBConnected == true
END FUNCTION
```

### Examples

- **Example 1**: Server starts with MONGO_URI containing database name in path → DNS SRV lookup fails with `querySrv ECONNREFUSED _mongodb._tcp.cluster0.68lhnh8.mongodb.net` → Server exits with code 1
- **Example 2**: Server starts without modular connection setup → Connection logic is tightly coupled in server.js → Difficult to test and maintain
- **Example 3**: Server starts with missing connection options → Connection may timeout or fail intermittently → Poor error messages and debugging experience
- **Edge Case**: Server starts with invalid MONGO_URI format → Should fail gracefully with clear error message indicating URI format issue

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Express middleware configuration (cors, express.json()) must continue to work exactly as before
- API route registration and handling must remain unchanged
- Health check endpoint (`GET /`) must continue to return the same response
- Server PORT configuration from environment variables must remain unchanged
- Error logging format and process exit behavior on connection failure must remain consistent

**Scope:**
All inputs that do NOT involve the MongoDB connection initialization should be completely unaffected by this fix. This includes:
- HTTP request handling after successful connection
- Route middleware execution
- Express app configuration
- Environment variable loading for non-database settings

## Hypothesized Root Cause

Based on the bug description and error message, the most likely issues are:

1. **DNS Resolution Issues**: The MongoDB Atlas connection string may have DNS SRV lookup problems
   - The error `querySrv ECONNREFUSED` indicates DNS cannot resolve the cluster hostname
   - This could be due to network configuration, firewall rules, or transient DNS issues
   - Missing connection options that help with DNS resolution

2. **Connection String Format**: The URI may be improperly formatted or missing required parameters
   - Database name in the path might be causing parsing issues
   - Missing or incorrect query parameters for Atlas connections

3. **Missing Connection Options**: Mongoose connection may need specific options for Atlas
   - Timeout settings may be too aggressive
   - Retry logic may not be configured
   - DNS resolution options may need to be specified

4. **Lack of Modular Structure**: Connection logic is embedded in server.js
   - Makes testing difficult
   - Violates separation of concerns
   - Harder to add connection retry logic or advanced error handling

## Correctness Properties

Property 1: Bug Condition - MongoDB Connection Succeeds

_For any_ server startup where a valid MONGO_URI is provided in environment variables, the fixed connectDB function SHALL successfully establish a connection to MongoDB Atlas, log "✅ MongoDB connected", and allow the Express server to start on the configured PORT.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Server Behavior

_For any_ server operation that does NOT involve the initial MongoDB connection setup (middleware configuration, route handling, health checks), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for request handling and server operations.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `backend/config/db.js` (NEW FILE)

**Function**: `connectDB`

**Specific Changes**:
1. **Create Database Configuration Module**: Create a new `config/db.js` file to encapsulate MongoDB connection logic
   - Import mongoose and dotenv
   - Define async connectDB function
   - Use try-catch for error handling

2. **Implement Connection Logic**: Use mongoose.connect() with proper configuration
   - Read MONGO_URI from process.env
   - Add connection options if needed (useNewUrlParser, useUnifiedTopology are deprecated but may help with older Mongoose versions)
   - Log success message on connection
   - Throw error on failure for caller to handle

3. **Export Function**: Make connectDB available for import in server.js
   - Use module.exports to export the function

**File 2**: `backend/server.js` (MODIFY)

**Specific Changes**:
1. **Import connectDB**: Add require statement for the new config/db module
   - `const connectDB = require('./config/db');`

2. **Refactor Connection Logic**: Replace inline mongoose.connect() with connectDB call
   - Remove direct mongoose.connect() call
   - Call connectDB() before starting server
   - Keep existing error handling pattern (log error, exit with code 1)

3. **Maintain Server Startup Flow**: Ensure server only starts after successful DB connection
   - Keep app.listen() inside the .then() block
   - Preserve PORT configuration
   - Maintain all existing middleware and route configurations

4. **Verify Middleware**: Ensure express.json() middleware is present (already exists)
   - No changes needed, just verification

5. **Verify PORT Configuration**: Ensure process.env.PORT is used (already exists)
   - No changes needed, just verification

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to start the server with various MongoDB URI configurations and observe connection behavior. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Current URI Test**: Start server with existing MONGO_URI from .env → Observe `querySrv ECONNREFUSED` error (will fail on unfixed code)
2. **URI Format Test**: Test with different URI formats (with/without database name in path) → Observe which formats fail (will help identify format issues)
3. **Connection Options Test**: Test connection with various mongoose options → Observe if missing options cause failures
4. **Network Isolation Test**: Test in environment with DNS restrictions → Observe DNS resolution behavior (may fail on unfixed code)

**Expected Counterexamples**:
- DNS SRV lookup fails with `querySrv ECONNREFUSED` error
- Possible causes: improper URI format, missing connection options, network/DNS configuration issues, lack of retry logic

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL serverStartup WHERE isBugCondition(serverStartup) DO
  result := connectDB_fixed()
  ASSERT result.connected == true
  ASSERT result.logMessage == "✅ MongoDB connected"
  ASSERT serverStarted == true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL serverOperation WHERE NOT isBugCondition(serverOperation) DO
  ASSERT server_original(serverOperation) = server_fixed(serverOperation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-connection-related operations

**Test Plan**: Observe behavior on UNFIXED code first for API requests, middleware, and route handling, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Middleware Preservation**: Observe that cors and express.json() middleware work correctly on unfixed code, then verify they continue working after fix
2. **Route Handling Preservation**: Observe that API routes respond correctly on unfixed code, then verify they continue working after fix
3. **Health Check Preservation**: Observe that GET / returns correct response on unfixed code, then verify it continues working after fix
4. **Error Handling Preservation**: Observe that connection failures exit with code 1 on unfixed code, then verify this behavior continues after fix

### Unit Tests

- Test connectDB function with valid MONGO_URI (should succeed)
- Test connectDB function with invalid MONGO_URI (should throw error)
- Test server startup sequence (connectDB → app.listen)
- Test that middleware is registered before routes
- Test that server uses correct PORT from environment

### Property-Based Tests

- Generate random valid MongoDB URIs and verify connectDB succeeds
- Generate random invalid URIs and verify connectDB fails gracefully
- Generate random HTTP requests and verify middleware/route handling is preserved
- Test that all API endpoints continue to work across many request scenarios

### Integration Tests

- Test full server startup flow with real MongoDB Atlas connection
- Test server startup with missing MONGO_URI (should fail gracefully)
- Test that all API routes work correctly after successful connection
- Test that health check endpoint responds correctly
- Test server restart behavior (connection should re-establish)
