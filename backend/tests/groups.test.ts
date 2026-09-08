import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';

const app = createApp();

let studentToken = '';
let studentId = 0;
let groupId = 0;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'student1@dev.studybuddy.test',
    password: 'Password123!',
  });
  studentToken = res.body.data?.token ?? '';
  studentId = res.body.data?.user?.id ?? 0;
});

afterAll(async () => {
  // Cleanup test groups
  if (groupId) {
    await prisma.groupMessage.deleteMany({ where: { groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.group.deleteMany({ where: { groupId } });
  }
  await prisma.$disconnect();
});

describe('Groups', () => {
  it('POST /api/groups — create group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Jest Test Group', messageQuota: 500 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Jest Test Group');
    groupId = res.body.data.groupId;
  });

  it('GET /api/groups — list groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/groups/:id — get group', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.groupId).toBe(groupId);
  });

  it('unauthenticated cannot list groups', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
  });
});

describe('Group Messages', () => {
  it('POST /api/groups/:id/messages — send message (HTTP fallback)', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Hello from Jest!' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Hello from Jest!');
    expect(res.body.data.senderId).toBe(studentId); // from server, not client
  });

  it('GET /api/groups/:id/messages — list messages', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('non-member cannot read messages', async () => {
    // Register a new user who is not in the group
    const newUserRes = await request(app).post('/api/auth/register').send({
      name: 'Non Member',
      email: `nonmember_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
    });
    const nonMemberToken = newUserRes.body.data.token;

    const res = await request(app)
      .get(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${nonMemberToken}`);
    expect(res.status).toBe(403);

    // Cleanup
    await prisma.user.deleteMany({ where: { email: newUserRes.body.data.user.email } });
  });

  it('message quota is enforced', async () => {
    // Set quota to 0 to force rejection
    await prisma.group.update({
      where: { groupId },
      data: { messageQuota: 0, messagesUsed: 0 },
    });

    const res = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'This should be rejected' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/quota/i);

    // Restore quota
    await prisma.group.update({
      where: { groupId },
      data: { messageQuota: 500 },
    });
  });
});
