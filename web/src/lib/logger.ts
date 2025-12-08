// Simple logger (có thể thay bằng Winston, Pino, etc.)
export const logger = {
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  }
}