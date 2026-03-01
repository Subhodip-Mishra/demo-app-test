// tests/database.test.js
const { getUsers } = require('../src/database')

test('fetches users from database', async () => {
    const users = await getUsers()
    expect(Array.isArray(users)).toBe(true)
})
```

This produces logs like:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect
    errno: -111
    code: 'ECONNREFUSED'
    syscall: 'connect'
    address: '127.0.0.1'
    port: 5432
```

**Now nobody immediately knows what this means.** ECONNREFUSED, port 5432, TCPConnectWrap — this looks like a network error not a missing env variable.

CodebaseAI says:
```
## What Failed
Database connection refused on port 5432

## Root Cause
DATABASE_URL environment variable is not 
set in CI. Without it the app tries to 
connect to localhost:5432 which does not 
exist in GitHub's clean environment.

## How To Fix
Add DATABASE_URL to GitHub Secrets:
Settings → Secrets → Actions → New secret
Name: DATABASE_URL
Value: your_postgres_connection_string

## Code Fix
# In .github/workflows/test.yml add:
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}