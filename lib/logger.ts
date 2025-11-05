// Niveaux de log disponibles
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Configuration par défaut
const config = {
  level: (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as LogLevel,
  prefix: '[Saasykon]',
};

// Fonction pour définir le niveau de log
export function setLogLevel(level: LogLevel) {
  if (level in LOG_LEVELS) {
    config.level = level;
  } else {
    console.warn(`Niveau de log invalide: ${level}. Niveaux disponibles: ${Object.keys(LOG_LEVELS).join(', ')}`);
  }
}

// Fonction utilitaire pour formater les messages
function formatMessage(level: LogLevel, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `${config.prefix} [${timestamp}] [${level.toUpperCase()}]`;
  
  try {
    // Si le premier argument est une chaîne, on l'utilise comme template
    if (typeof args[0] === 'string') {
      const [message, ...rest] = args;
      return `${prefix} ${message}${rest.length > 0 ? ' ' + rest.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') : ''}`;
    }
    // Sinon on sérialise tout
    return `${prefix} ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}`;
  } catch (e) {
    return `${prefix} Erreur lors du formatage du message: ${e}`;
  }
}

// Fonction de log de base
function log(level: LogLevel, ...args: any[]) {
  if (LOG_LEVELS[level] > LOG_LEVELS[config.level]) {
    return; // Niveau de log trop bas
  }

  const message = formatMessage(level, ...args);
  
  switch (level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'info':
      console.info(message);
      break;
    case 'debug':
      console.debug(message);
      break;
    default:
      console.log(message);
  }
}

// Méthodes exportées
export const logger = {
  error: (...args: any[]) => log('error', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  info: (...args: any[]) => log('info', ...args),
  debug: (...args: any[]) => log('debug', ...args),
  
  // Pour les logs de requête API
  api: {
    request: (method: string, url: string, data?: any) => 
      log('debug', `API Request: ${method} ${url}`, data || ''),
    
    response: (method: string, url: string, status: number, data?: any) => 
      log('debug', `API Response: ${method} ${url} ${status}`, data || ''),
    
    error: (method: string, url: string, error: any) => 
      log('error', `API Error: ${method} ${url}`, error)
  },
  
  // Pour les logs de base de données
  db: {
    query: (query: string, params?: any) => 
      log('debug', 'DB Query:', query, params ? 'Params:' : '', params || ''),
    
    error: (query: string, error: any) => 
      log('error', 'DB Error:', query, error)
  }
};

// Configuration du niveau de log en fonction de l'environnement
if (process.env.NODE_ENV === 'production') {
  setLogLevel('info');
} else {
  setLogLevel('debug');
}

export default logger;
