import { ApiException } from './types'
import { logger } from './logger'

// Error handler wrapper for API routes
export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error: any) {
      logger.error('API Error:', error)

      // Handle custom ApiException
      if (error instanceof ApiException) {
        return Response.json({
          success: false,
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined
        }, { status: error.statusCode })
      }

      // Handle Prisma errors
      if (error.code === 'P2002') {
        return Response.json({
          success: false,
          error: 'Duplicate entry',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 409 })
      }

      // Handle validation errors
      if (error.name === 'ZodError') {
        return Response.json({
          success: false,
          error: 'Validation failed',
          details: process.env.NODE_ENV === 'development' ? error.errors : undefined
        }, { status: 400 })
      }

      // Handle generic errors
      return Response.json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 })
    }
  }
}