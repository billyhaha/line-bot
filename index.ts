import { serverOf, serverStart } from './server'

const server = serverOf()

serverStart(server)
  .then(() => {
    console.log(`Server start successfully`)
  })
  .catch((error) => {
    console.log(`Failed to start server: ${error}`)
  })
