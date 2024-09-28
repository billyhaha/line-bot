import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import dotenv from 'dotenv'
import line from '@line/bot-sdk'

dotenv.config()

const fastifyConfig = {
  port: Number(process.env.FASTIFY_PORT),
  host: process.env.FASTIFY_HOST,
}
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
}

export const serverOf = (): FastifyInstance => {
  const server = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      },
      level: 'debug',
    },
  })

  server.get('/ping', async (request, reply) => {
    return reply.status(200).send({ msg: 'pong' })
  })

  return server
}

export const serverStart = async (
  server: FastifyInstance
): Promise<FastifyInstance> => {
  await server.listen(fastifyConfig)

  return server
}
