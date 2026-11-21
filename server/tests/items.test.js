
// Backend tests for /api/items — THIS is the only backend file you edit.
// Run with: npm test --workspace server
//
// tests/setup.js already starts an in-memory MongoDB and empties it after
// every test, so each test starts from a clean database.
import request from 'supertest';
import app from '../src/app.js';

// Helper: registers a user and returns their JWT.
async function registerAndGetToken(name = 'Alice', email = 'alice@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' });
  return res.body.token;
}

// Helper: creates an item as the user owning `token` and returns it.
async function createItem(token, body = {}) {
  const res = await request(app)
    .post('/api/items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Black backpack',
      status: 'lost',
      category: 'accessories',
      location: 'Library',
      ...body
    });
  return res.body.item;
}

describe('/api/items', () => {

  // Worked example
  test('GET is public and returns an empty list when there are no items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  // TEST 1: Duplicate item -> 409
  test('POST returns 409 when the same title is reported at the same location twice', async () => {
    // 1. Register a user and get their token
    const token = await registerAndGetToken();

    // 2. Create the first item
    await createItem(token);

    // 3. Try to create the exact same item again
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Black backpack',
        status: 'lost',
        category: 'accessories',
        location: 'Library'
      });

    // 4. Check that the server rejects the duplicate
    expect(res.status).toBe(409);
  });

  // TEST 2: Unauthorized edit -> 403
  test('PATCH returns 403 when someone who is not the reporter edits the item', async () => {
    // 1. Register two different users
    const aliceToken = await registerAndGetToken('Alice', 'alice@test.com');
    const bobToken = await registerAndGetToken('Bob', 'bob@test.com');

    // 2. Alice creates an item
    const item = await createItem(aliceToken);

    // 3. Bob tries to edit Alice's item
    const res = await request(app)
      .patch(`/api/items/${item._id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Updated backpack' });

    // 4. Verify that Bob is forbidden from editing it
    expect(res.status).toBe(403);
  });

});
