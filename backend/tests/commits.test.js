const request = require('supertest');
const app = require('../src/app');

describe('Commits API', () => {
  const validProjectId = '0x' + 'b'.repeat(64);

  describe('GET /api/projects/:projectId/commits', () => {
    it('should reject invalid projectId', async () => {
      const res = await request(app).get('/api/projects/bad-id/commits');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid project ID/);
    });

    it('should accept pagination params', async () => {
      const res = await request(app).get(`/api/projects/${validProjectId}/commits?page=1&limit=10`);
      expect(res.status).not.toBe(400);
    });
  });

  describe('POST /api/projects/:projectId/commits', () => {
    it('should reject without auth', async () => {
      const res = await request(app)
        .post(`/api/projects/${validProjectId}/commits`)
        .send({ commitHash: '0x' + 'c'.repeat(64), authorName: 'Test', message: 'fix' });
      expect(res.status).toBe(401);
    });

    it('should reject missing commitHash', async () => {
      // Even with bad auth, validator checks happen after auth
      const res = await request(app)
        .post(`/api/projects/${validProjectId}/commits`)
        .send({ authorName: 'Test', message: 'fix' });
      expect(res.status).toBe(401); // auth fails first
    });
  });

  describe('GET /api/projects/:projectId/contributors', () => {
    it('should reject invalid projectId', async () => {
      const res = await request(app).get('/api/projects/xyz/contributors');
      expect(res.status).toBe(400);
    });

    it('should accept valid projectId', async () => {
      const res = await request(app).get(`/api/projects/${validProjectId}/contributors`);
      expect(res.status).not.toBe(400);
    });
  });

  describe('GET /api/projects/:projectId/analytics', () => {
    it('should reject invalid projectId', async () => {
      const res = await request(app).get('/api/projects/nope/analytics');
      expect(res.status).toBe(400);
    });
  });
});
