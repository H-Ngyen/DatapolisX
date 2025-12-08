import { ApiException } from "./types"

export class BadRequestException extends ApiException {
  constructor(message: string = 'Bad Request', details?: string) {
    super(400, message, details)
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string = 'Unauthorized', details?: string) {
    super(401, message, details)
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string = 'Not Found', details?: string) {
    super(404, message, details)
  }
}

export class InternalServerException extends ApiException {
  constructor(message: string = 'Internal Server Error', details?: string) {
    super(500, message, details)
  }
}