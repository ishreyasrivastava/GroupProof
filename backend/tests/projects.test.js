const request = require('supertest');
const app = require('../src/app');

describe('Projects API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/projects/:projectId', () => {
    it('should reject invalid projectId format', async () => {
      const res = await request(app).get('/api/projects/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid project ID/);
    });

    it('should accept valid bytes32 projectId', async () => {
      const validId = '0x' + 'a'.repeat(64);
      const res = await request(app).get(`/api/projects/${validId}`);
      // Will fail at blockchain level but pass validation
      expect(res.status).not.toBe(400);
    });
  });

  describe('POST /api/projects', () => {
    it('should reject request without auth headers', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing authentication/);
    });

    it('should reject invalid wallet address in auth', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('x-wallet-address', 'not-an-address')
        .set('x-signature', '0x1234')
        .set('x-message', '{}')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:address/projects', () => {
    it('should reject invalid address', async () => {
      const res = await request(app).get('/api/users/invalid-addr/projects');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid Ethereum address/);
    });

    it('should accept valid address format', async () => {
      const addr = '0x' + '1'.repeat(40);
      const res = await request(app).get(`/api/users/${addr}/projects`);
      // Passes validation, may fail at blockchain
      expect(res.status).not.toBe(400);
    });
  });
});
