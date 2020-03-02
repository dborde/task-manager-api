const request = require('supertest')

const getResponse = (app, path, token) => 
  request(app)
    .get(path)
    .set('Authorization', `Bearer ${token}`)
    .send()
 
const sort = (responseBody, field) => responseBody.map((x) => x[field])

module.exports = {
  getResponse,
  sort
}
