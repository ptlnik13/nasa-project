const request = require('supertest');
const app = require('../../app');
const {mongoConnect, mongoDisconnect} = require('../../services/mongo');

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
    });
    afterAll(async () => {
        await mongoDisconnect();
    })
    describe('Test GET /launches', () => {
        test('It should respond with 200 Success', async () => {
            const response = await request(app).get('/v1/launches').expect(200);
            // expect(response.statusCode).toBe(200);
        })
    })
    describe('Test POST /launches', () => {
        const completeLaunchData = {mission: 'US', rocket: 'RC123', target: 'Kepler-62 f', launchDate: '11/22/28'}
        const launchDataWithoutDate = {mission: 'US', rocket: 'RC123', target: 'Kepler-62 f'}
        const launchDataWithInvalidDate = {mission: 'US', rocket: 'RC123', target: 'Kepler-62 f', launchDate: 'hello'}
        test('It should respond with 201 created', async () => {
            const response = await request(app).post('/v1/launches').send(completeLaunchData).expect(201);
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(requestDate).toBe(responseDate);
            expect(response.body).toMatchObject(launchDataWithoutDate)
        });
        test('It should catch missing required properties', async () => {
            const response = await request(app).post('/v1/launches').send(launchDataWithoutDate).expect(400);
            expect(response.body).toStrictEqual({
                error: 'Missing required launch properties'
            })
        });
        test('It should also catch Invalid Date', async () => {
            const response = await request(app).post('/v1/launches').send(launchDataWithInvalidDate).expect(400);
            expect(response.body).toStrictEqual({
                error: 'Date should be valid'
            })
        });
    });
})