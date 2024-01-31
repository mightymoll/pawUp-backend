const request = require('supertest');
const app = require('./app.js');

describe('Express API', () => {
  it('GET / --> all Users', () => {
    return request(app)
      .get('/')
      // set content type as json
      .expect('Content-Type', 'application/json; charset=utf-8',)
      // expect a good outcome/success
      .expect(200)
      .then((response) => {
        // response should be an array containing objects
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              lastName: expect.any(String),
              firstName: expect.any(String),
              email: expect.any(String),
              password: expect.any(String),
              access: expect.any(String),
            })
          ])
        )
      })
  });

  it('GET /user/id --> one User', () => {
    return request(app)
      .get('/user/659679b7b96783a8a0a8506d')
      // set content type as json
      .expect('Content-Type', 'application/json; charset=utf-8')
      // expect a good outcome/success
      .expect(200)
      // ONLY NEED REQUIRED
      .then((response) => {
        expect.objectContaining({
          lastName: expect.any(String),
          firstName: expect.any(String),
          email: expect.any(String),
          password: expect.any(String),
          access: expect.any(String),
        })
      })
  });

  it('GET /user/id --> 404 not found', () => {
    return request(app)
      .get('/user/9999999999')
      .expect(404)
  });

  it('POST /api/adduser, --> created user', () => {
    return request(app).post('/api/adduser').send({
      lastName: "Smith",
      firstName: "John",
      email: "jsmith@gmail.com",
      password: "jsmith123",
      access: "public",
    }).expect('Content-Type', 'text/html; charset=utf-8')
      .expect(201)
      .then(response => {
        expect(response.body).toEqual(
          expect.objectContaining({
            result: expect.any(String)
          })
        )
      })
  })
})
