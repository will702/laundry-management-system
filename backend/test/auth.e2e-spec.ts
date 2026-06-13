import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login → 401 on wrong PIN', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ name: 'nonexistent', pin: '0000' })
      .expect(401);
  });

  it('GET /api/settings → 200 (public endpoint)', async () => {
    return request(app.getHttpServer()).get('/api/settings').expect(200);
  });

  it('GET /api/employees → 401 without token', async () => {
    return request(app.getHttpServer()).get('/api/employees').expect(401);
  });

  it('GET /api/reports/daily-sales → 401 without token', async () => {
    return request(app.getHttpServer())
      .get('/api/reports/daily-sales')
      .expect(401);
  });
});
