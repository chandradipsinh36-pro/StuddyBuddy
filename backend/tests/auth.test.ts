import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';

const app = createApp();

describe('Authentication', () => {
  const testEmail = `test_${Date.now()}@test.studybuddy.test`;
  let authToken = '';

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Student',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // never expose hash
      authToken = res.body.data.token;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
      });
      expect(res.status).toBe(409);
    });

    it('should reject admin role registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Evil Admin',
        email: `admin_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'admin',
      });
      expect(res.status).toBe(422); // Zod rejects 'admin'
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak',
        email: `weak_${Date.now()}@test.com`,
        password: '1234',
        role: 'student',
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'Password123!',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'WrongPassword',
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('should reject missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});

describe('Health check', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
