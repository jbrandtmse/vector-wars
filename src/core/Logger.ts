export class Logger {
  static debug(_system: string, _message: string, _context?: Record<string, unknown>): void {}
  static info(_system: string, _message: string, _context?: Record<string, unknown>): void {}
  static warn(_system: string, _message: string, _context?: Record<string, unknown>): void {}
  static error(_system: string, _message: string, _context?: Record<string, unknown>): void {}
}
