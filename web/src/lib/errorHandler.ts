/**
 * MIT License
 * Copyright (c) 2025 DatapolisX
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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