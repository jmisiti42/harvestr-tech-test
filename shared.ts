import 'express-async-errors'

import express from 'express'
import settings from '../config/config'
import { connect } from 'mongoose'

import mainRouter from './router'

import { Block } from './models/block/schema'

async function startup () {
  const app = express()
  await connect(settings.get('MONGO_MAIN_URL'), { useNewUrlParser: true, useUnifiedTopology: true })

  // define models in `req` so they can be used inside controllers
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.models = {
      Blocks: Block
    }
    return next()
  })

  app.use('/v1', mainRouter)

  /**
   * Errors middlewares that will handle errors thrown
   *  from controllers/middlewares
   */
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err !== undefined && err !== null) {
      if (typeof err.message === 'object') {
        err = Object.assign(err, err.message)
      }
      console.error('Error in express routes', err)
      return res.status(err.statusCode || 500).json({
        error: err.message,
        cause: err.statusCode < 500 ? 'Client Error' : 'Internal Error'
      })
    }
    return next()
  })

  return app
}

export default startup

if (require.main === module) {
  const port = settings.get('PORT') as string
  startup()
    .then(app => app.listen(parseInt(port, 10), () => {
      if (settings.get('SILENT') === false) {
        console.log(`server started on port ${port}`)
      }
    })).catch(err => {
      console.error(`Failed to start server`, err)
      return process.exit(1)
    })
}