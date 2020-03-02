// run database first
// /Users/dborde/mongodb/bin/mongod --dbpath=/Users/dborde/mongodb-data/
const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const {
    userOne,
    userTwo,
    userOneId,
    userTwoId,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
} = require('./fixtures/db')

const {
    getResponse,
    sort
} = require('./fixtures/utils')

beforeEach(setupDatabase)

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201)
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Should fetch user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.length).toEqual(2)
})

test('User should not be able to delete another users tasks', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})


test('Should not create task with invalid description', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(400)
})

test('Should not create task with invalid (non boolean) completed type', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'some task',
            completed: 'done'
        })
        .expect(400)
})

test('Should not update task with invalid property', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Bill'
        })
        .expect(400)
})

test('Should not update task with invalid description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: ''
        })
        .expect(400)

    // verify that the task that we desired to update did not change in the database
    const task = await Task.findById(taskOne._id)
    expect(task.description).toBe(taskOne.description)
})

test('Should not update task with invalid (non boolean) completed type', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'new description',
            completed: 'done'
        })
        .expect(400)

    // verify that the task that we desired to update did not change in the database
    const task = await Task.findById(taskOne._id)
    expect(task.description).toBe(taskOne.description)
})

test('Should delete user task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    // verify that the task that we desired delete is not in the database
    const task = await Task.findById(taskOne._id)
    expect(task).toBeNull()
})

test('Should not delete task if unauthenticated', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)

    // verify that the task that we desired to delete is still in the database
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

test('Should not update other users task', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send({
            description: 'Update task'
        })
        .expect(404)

    // verify that the task that we desired to update is still in the database
    const task = await Task.findById(taskOne._id);
    expect(task.description).toBe(taskOne.description)
})

test('Should fetch user task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body).not.toBeNull()
})

test('Should not fetch user task by id if unauthenticated', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)

    expect(response.body).toMatchObject({error: 'Please authenticate.'})
})

test('Should not fetch other users task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
})


test('Should fetch only completed tasks', async () => {
    const response = await request(app)
        .get('/tasks/?completed=true')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body[0].completed).toBe(true)
})

const keys = ['completed', 'description', 'createdAt', 'updatedAt'];

test('Should fetch only incomplete tasks', async () => {
    const response = await request(app)
        .get('/tasks/?completed=false')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body[0].completed).toBe(false)
})

test('Should sort tasks by completed', async () => {
    // const keys = ['completed', 'description', 'createdAt', 'updatedAt'];
    const sort = (responseBody, field) => responseBody.map((x) => x[field])
    const response = await getResponse(app, '/tasks?sortBy=completed:desc', userOne.tokens[0].token).expect(200)
    const completedDesc = sort(response.body, 'completed')
    expect(completedDesc).toEqual([true, false])
})


test('Should sort tasks by completed', async () => {
    let response
    response = await getResponse(app, '/tasks?sortBy=completed:desc', userOne.tokens[0].token).expect(200)
    const completedDesc = sort(response.body, 'completed')
    expect(completedDesc).toEqual([true, false])

    response = await getResponse(app, '/tasks?sortBy=completed:asc', userOne.tokens[0].token).expect(200)
    const completedAsc = sort(response.body, 'completed')
    expect(completedAsc).toEqual([false, true])
})

test('Should sort tasks by description', async () => {
    let response;
    response = await getResponse(app, '/tasks?sortBy=description:desc', userOne.tokens[0].token).expect(200)
    const descriptionDesc = sort(response.body, 'description')
    expect(descriptionDesc).toEqual(['Second task', 'First task'])

    response = await getResponse(app, '/tasks?sortBy=description:asc', userOne.tokens[0].token).expect(200)
    const descriptionAsc = sort(response.body, 'description')
    expect(descriptionAsc).toEqual(['First task', 'Second task'])
})

test('Should sort tasks by createdAt', async () => {
    let response;
    response = await getResponse(app, '/tasks?sortBy=createdAt:desc', userOne.tokens[0].token).expect(200)
    const createdAtDesc = sort(response.body, 'createdAt')
    expect(Date.parse(createdAtDesc[0])).toBeGreaterThan(Date.parse(createdAtDesc[1]))

    response = await getResponse(app, '/tasks?sortBy=createdAt:asc', userOne.tokens[0].token).expect(200)
    const createdAtAsc = sort(response.body, 'createdAt')
    expect(Date.parse(createdAtAsc[1])).toBeGreaterThan(Date.parse(createdAtAsc[0]))
})

test('Should sort tasks by updatedAt', async () => {
    let response;
    response = await getResponse(app, '/tasks?sortBy=updatedAt:desc', userOne.tokens[0].token).expect(200)
    const updatedAtDesc = sort(response.body, 'updatedAt')
    expect(Date.parse(updatedAtDesc[0])).toBeGreaterThan(Date.parse(updatedAtDesc[1]))

    response = await getResponse(app, '/tasks?sortBy=updatedAt:asc', userOne.tokens[0].token).expect(200)
    const updatedAtAsc = sort(response.body, 'updatedAt')
    expect(Date.parse(updatedAtAsc[1])).toBeGreaterThan(Date.parse(updatedAtAsc[0]))
})

test('Should fetch page of tasks.', async () => {
    // showing all tasks for userOne
    const response = await request(app)
        .get('/tasks/?limit=2&skip=0')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
        
    // the total tasks for userOne are 2. If we add query param: skip=1; or, completed=true; or, limit=1,
    // we would expect just one task in the page
    expect(response.body.length).toBe(2);
});




