// run database first
// /Users/dborde/mongodb/bin/mongod --dbpath=/Users/dborde/mongodb-data/

const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)
  
test('Should sign up new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'David',
        email: 'david@example.com',
        password: 'MyPass777!'
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()
    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'David',
            email: 'david@example.com'
        },
        token: user.tokens[0].token
    })
    // Assert password is not stored in database
    expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    // Assert token in response matches users second token
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'bill@example.com',
        password: 'BillPass555!'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        // no set()
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    // Assert that user was removed
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        // no set()
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'David',
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toBe('David')
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Chicago',
        })
        .expect(400)
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    // Assert token in response matches users second token
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not signup user with invalid name', async () => {
    // name cannot be empty
    const response = await request(app).post('/users').send({
        name: '',
        email: 'david@example.com',
        password: 'MyPass777!'
    }).expect(400)
})

test('Should not signup user with invalid email', async () => {
    // email would have an '@' symbol
    const response = await request(app).post('/users').send({
        name: 'dave',
        email: 'davidexample.com',
        password: 'MyPass777!'
    }).expect(400)
})

test('Should not signup user with invalid password', async () => {
    // password should have minlength: 7
    const response = await request(app).post('/users').send({
        name: 'dave',
        email: 'davidexample.com',
        password: 'MyPas'
    }).expect(400)
})

test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            email: 'dave@bigad.tv',
            password: 'Welcome1!'
        })
        .expect(401)
})

test('Should not update user with invalid name', async () => {
    // name update cannot be empty
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: ''
        })
        .expect(400)
})

test('Should not update user with invalid email', async () => {
     // email update would have an '@' symbol
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            email: 'davebigad.tv',
        })
        .expect(400)
})

test('Should not update user with invalid password', async () => {
    // password cannot contain 'password'
   await request(app)
       .patch('/users/me')
       .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
       .send({
          password: 'password'
       })
       .expect(400)
})

test('Should not delete user if unauthenticated', async () => {
   await request(app)
       .delete('/users/me')
       .send()
       .expect(401)
})
