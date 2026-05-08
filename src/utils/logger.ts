type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let currentLevel: LogLevel = 'info';

export function setLogLevel(verbose: boolean): void {
  currentLevel = verbose ? 'debug' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

export function debug(msg: string): void {
  if (shouldLog('debug')) console.debug(`[DEBUG] ${msg}`);
}

export function info(msg: string): void {
  if (shouldLog('info')) console.log(msg);
}

export function warn(msg: string): void {
  if (shouldLog('warn')) console.warn(`[WARN] ${msg}`);
}

export function error(msg: string): void {
  if (shouldLog('error')) console.error(`[ERROR] ${msg}`);
}
