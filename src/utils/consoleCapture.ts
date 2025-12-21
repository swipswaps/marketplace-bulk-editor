/**
 * Global Console Capture System
 * Intercepts all console.log, console.error, console.warn, console.info calls
 * and stores them for display in the UI Debug Console
 */

export interface ConsoleEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  args: any[];
}

type ConsoleListener = (entry: ConsoleEntry) => void;

class ConsoleCapture {
  private listeners: ConsoleListener[] = [];
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  constructor() {
    this.interceptConsole();
    this.interceptGlobalErrors();
  }

  private interceptConsole() {
    // Intercept console.log
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      this.notifyListeners('log', args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.notifyListeners('error', args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.notifyListeners('warn', args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      this.notifyListeners('info', args);
    };
  }

  private interceptGlobalErrors() {
    // Capture unhandled errors (including network errors)
    window.addEventListener('error', (event) => {
      const message = event.error
        ? `${event.error.name}: ${event.error.message}`
        : event.message;

      this.originalConsole.error('Unhandled error:', message);
      this.notifyListeners('error', ['🚨 Unhandled Error:', message]);
    });

    // Capture unhandled promise rejections (fetch failures, etc.)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error
        ? `${event.reason.name}: ${event.reason.message}`
        : String(event.reason);

      this.originalConsole.error('Unhandled promise rejection:', reason);
      this.notifyListeners('error', ['🚨 Network/Promise Error:', reason]);
    });
  }

  private notifyListeners(level: ConsoleEntry['level'], args: any[]) {
    const entry: ConsoleEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatArgs(args),
      args,
    };

    this.listeners.forEach(listener => listener(entry));
  }

  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  public addListener(listener: ConsoleListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: ConsoleListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public restore() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
  }
}

// Global singleton instance
export const consoleCapture = new ConsoleCapture();

