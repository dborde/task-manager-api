const express = require('express')
// require('./db/mongoose') ensures mongoose.connect('mongodb://127.0.0.1:27017/task-manager-api' is used to connect to db
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

// automically parse incoming json to an object so we can access it in our request handlers
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})