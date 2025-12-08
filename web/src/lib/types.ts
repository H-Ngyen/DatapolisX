export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  name: string
}

export class ApiException extends Error {
  public statusCode: number
  public details?: string

  constructor(statusCode: number, message: string, details?: string) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.name = 'ApiException'
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiCallState<T> {
  data: T | null; 
  loading: boolean;
  error: Error | null; 
  execute: (
    endpoint: string,
    method?: HttpMethod,
    body?: object | null 
  ) => Promise<void>; 
}

export interface DetectionData {
  motorbike?: number;
  car?: number;
  truck?: number;
  bus?: number;
  container?: number;
  [key: string]: any;
}