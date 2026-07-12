// Integration tests for links + redirect + analytics. Covers the cross-tier
// flow: create a link, visit it (redirect), and see the click recorded.
import request from 'supertest';
import { createApp } from '../../src/app';
import { resetDb, disconnectDb } from './helpers/db';

const app = createApp();

// Register a fresh user and return a Supertest agent that carries the session
// cookie, plus the created user.
async function newUserAgent(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ email, password: 'password123' });
  return agent;
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('POST /api/links', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/links').send({ originalUrl: 'https://a.com' });
    expect(res.status).toBe(401);
  });

  it('creates a link with an auto-generated code', async () => {
    const agent = await newUserAgent('creator@example.com');
    const res = await agent.post('/api/links').send({ originalUrl: 'https://example.com/page' });
    expect(res.status).toBe(201);
    expect(res.body.link.code).toHaveLength(7);
    expect(res.body.link.isCustomAlias).toBe(false);
    expect(res.body.shortUrl).toContain(res.body.link.code);
  });

  it('creates a link with a custom alias', async () => {
    const agent = await newUserAgent('alias@example.com');
    const res = await agent
      .post('/api/links')
      .send({ originalUrl: 'https://example.com/page', customAlias: 'mycoollink' });
    expect(res.status).toBe(201);
    expect(res.body.link.code).toBe('mycoollink');
    expect(res.body.link.isCustomAlias).toBe(true);
  });

  it('rejects a duplicate custom alias', async () => {
    const agent = await newUserAgent('dupalias@example.com');
    await agent
      .post('/api/links')
      .send({ originalUrl: 'https://example.com/a', customAlias: 'taken' });
    const res = await agent
      .post('/api/links')
      .send({ originalUrl: 'https://example.com/b', customAlias: 'taken' });
    expect(res.status).toBe(409);
  });

  it('rejects a reserved custom alias', async () => {
    const agent = await newUserAgent('reserved@example.com');
    const res = await agent
      .post('/api/links')
      .send({ originalUrl: 'https://example.com/a', customAlias: 'admin' });
    expect(res.status).toBe(422); // blocked by the zod schema before the service
  });
});

describe('GET /api/links', () => {
  it('lists only the current user links', async () => {
    const alice = await newUserAgent('alice@example.com');
    const bob = await newUserAgent('bob@example.com');

    await alice.post('/api/links').send({ originalUrl: 'https://a.com', customAlias: 'alice1' });
    await bob.post('/api/links').send({ originalUrl: 'https://b.com', customAlias: 'bob1' });

    const res = await alice.get('/api/links');
    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(1);
    expect(res.body.links[0].code).toBe('alice1');
  });
});

describe('GET /:code (redirect) records a click', () => {
  it('redirects with 302 and increments the click count', async () => {
    const agent = await newUserAgent('redir@example.com');
    const created = await agent
      .post('/api/links')
      .send({ originalUrl: 'https://example.com/dest', customAlias: 'goto' });
    const linkId = created.body.link.id;

    // Visit the short link (unauthenticated is fine for redirects).
    const redirectRes = await request(app).get('/goto');
    expect(redirectRes.status).toBe(302);
    expect(redirectRes.headers.location).toBe('https://example.com/dest');

    // The dashboard analytics should now show one click.
    const analytics = await agent.get(`/api/links/${linkId}/analytics`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.totalClicks).toBe(1);
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
  });
});
