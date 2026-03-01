const { getUsers } = require('../src/database')

test('fetches users from database', async () => {
    const users = await getUsers()
    expect(Array.isArray(users)).toBe(true)
})