import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';

const app = createApp();

let tutorToken = '';
let studentToken = '';
let tutorId = 0;
let studentId = 0;

// ── Setup ───────────────────────────────────────────────────────────
beforeAll(async () => {
  // Login as dev seed tutor
  const tutorRes = await request(app).post('/api/auth/login').send({
    email: 'tutor1@dev.studybuddy.test',
    password: 'Password123!',
  });
  tutorToken = tutorRes.body.data?.token ?? '';
  tutorId = tutorRes.body.data?.user?.id ?? 0;

  const studentRes = await request(app).post('/api/auth/login').send({
    email: 'student1@dev.studybuddy.test',
    password: 'Password123!',
  });
  studentToken = studentRes.body.data?.token ?? '';
  studentId = studentRes.body.data?.user?.id ?? 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Categories ──────────────────────────────────────────────────────
describe('GET /api/categories', () => {
  it('should list categories publicly', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ── Courses ─────────────────────────────────────────────────────────
describe('Courses', () => {
  let courseId = 0;

  it('GET /api/courses — public listing', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/tutor/courses — tutor can create course', async () => {
    const res = await request(app)
      .post('/api/tutor/courses')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ title: 'Test Course From Jest', description: 'Automated test', price: 9.99 });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Course From Jest');
    courseId = res.body.data.courseId;
  });

  it('POST /api/tutor/courses — student CANNOT create course', async () => {
    const res = await request(app)
      .post('/api/tutor/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Illegal', price: 0 });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/tutor/courses/:id — tutor can update own course', async () => {
    const res = await request(app)
      .patch(`/api/tutor/courses/${courseId}`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('DELETE /api/tutor/courses/:id — tutor can delete own course', async () => {
    const res = await request(app)
      .delete(`/api/tutor/courses/${courseId}`)
      .set('Authorization', `Bearer ${tutorToken}`);
    expect(res.status).toBe(204);
  });
});

// ── Tutor Profile & Skills ──────────────────────────────────────────
describe('Tutor Skills', () => {
  let skillId = 0;

  it('POST /api/tutors/me/skills — add skill', async () => {
    const res = await request(app)
      .post('/api/tutors/me/skills')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ skillName: 'Jest Testing', proficiency: 'beginner' });
    expect(res.status).toBe(201);
    expect(res.body.data.skillName).toBe('Jest Testing');
    skillId = res.body.data.skillId;
  });

  it('DELETE /api/tutors/me/skills/:id — remove skill', async () => {
    const res = await request(app)
      .delete(`/api/tutors/me/skills/${skillId}`)
      .set('Authorization', `Bearer ${tutorToken}`);
    expect(res.status).toBe(204);
  });

  it('student CANNOT manage tutor skills', async () => {
    const res = await request(app)
      .post('/api/tutors/me/skills')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ skillName: 'Hack', proficiency: 'expert' });
    expect(res.status).toBe(403);
  });
});

// ── Authorization Tests ─────────────────────────────────────────────
describe('Authorization security', () => {
  it('unauthenticated cannot access student endpoints', async () => {
    const res = await request(app).get('/api/students/me/enrollments');
    expect(res.status).toBe(401);
  });

  it('unauthenticated cannot access tutor endpoints', async () => {
    const res = await request(app).get('/api/tutor/courses');
    expect(res.status).toBe(401);
  });

  it('student cannot access tutor resources endpoint', async () => {
    const res = await request(app)
      .get('/api/tutor/resources')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});
