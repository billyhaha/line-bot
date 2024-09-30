import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from 'fastify'
import dotenv from 'dotenv'
import line, {
  ClientConfig,
  MessageAPIResponseBase,
  messagingApi,
  MiddlewareConfig,
  middleware,
  webhook,
  HTTPFetchError,
} from '@line/bot-sdk'

dotenv.config()

const fastifyConfig = {
  port: Number(process.env.FASTIFY_PORT) || 3000,
  host: process.env.FASTIFY_HOST || '0.0.0.0',
}

const middlewareConfig: MiddlewareConfig = {
  channelSecret: process.env.CHANNEL_SECRET || '',
}

const clientConfig: ClientConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
}
const client = new messagingApi.MessagingApiClient(clientConfig)

// Function handler to receive the text.
const textEventHandler = async (
  event: webhook.Event
): Promise<MessageAPIResponseBase | undefined> => {
  // Process all variables here.

  // Check if for a text message
  if (event.type !== 'message' || event.message.type !== 'text') {
    return
  }

  // Process all message related variables here.

  // Check if message is repliable
  if (!event.replyToken) return

  // Create a new message.
  // Reply to the user.
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: 'text',
        text: event.message.text,
      },
    ],
  })
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
  server.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply): Promise<Response> => {
      return reply.code(200).send({
        status: 'success',
        message: 'Connected successfully!',
      })
    }
  )

  //line webhoot
  server.post(
    '/callback',
    { preHandler: middleware(middlewareConfig) as any },
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const callbackRequest: webhook.CallbackRequest =
        req.body as webhook.CallbackRequest
      const events: webhook.Event[] = callbackRequest.events || []

      // Process all the received events asynchronously.
      const results = await Promise.all(
        events.map(async (event: webhook.Event) => {
          try {
            await textEventHandler(event)
          } catch (err: unknown) {
            if (err instanceof HTTPFetchError) {
              console.error(err.status)
              console.error(err.headers?.get('x-line-request-id'))
              console.error(err.body)
            } else if (err instanceof Error) {
              console.error(err)
            }

            // Handle error in the map and don't return reply here.
            return {
              status: 'error',
              error: err,
            }
          }
        })
      )

      // Return a successful message.
      reply.code(200).send({
        status: 'success',
        results,
      })
    }
  )

  return server
}

export const serverStart = async (
  server: FastifyInstance
): Promise<FastifyInstance> => {
  await server.listen(fastifyConfig)

  return server
}
