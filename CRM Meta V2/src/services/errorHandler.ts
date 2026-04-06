/**
 * Error Handler Centralizado - Padrão único para tratamento de erros em toda aplicação
 * Padroniza logging, contexto e mensagens ao usuário
 */

export interface ApiError {
  code: string; // Código único do erro (ex: 'CUSTOMER_NOT_FOUND')
  message: string; // Mensagem técnica para logging
  statusCode: number; // HTTP status code (400, 401, 404, 500, etc)
  userMessage?: string; // Mensagem amigável ao usuário
  context?: Record<string, any>; // Contexto adicional para debugging
  originalError?: Error; // Erro original se houver
}

/**
 * Classe customizada para erros da aplicação CRM
 */
export class CrmError extends Error {
  code: string;
  statusCode: number;
  userMessage: string;
  context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CrmError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage || getDefaultUserMessage(statusCode);
    this.context = context;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CrmError);
    }
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      context: this.context,
    };
  }
}

/**
 * Wrapper para operações assíncronas com tratamento robusto de erro
 */
export async function withErrorHandler<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback?: T,
  context?: Record<string, any>
): Promise<T> {
  try {
    logOperation('START', operationName, context);
    const result = await operation();
    logOperation('SUCCESS', operationName, context);
    return result;
  } catch (error) {
    const crmError = normalizeError(error, operationName, context);
    logError(crmError);

    // Se houver fallback e erro não é crítico, retornar fallback
    if (fallback !== undefined && crmError.statusCode >= 500) {
      console.warn(`Retornando fallback para ${operationName}:`, fallback);
      return fallback;
    }

    throw crmError;
  }
}

/**
 * Normaliza diferentes tipos de erro em CrmError padrão
 */
export function normalizeError(
  error: any,
  context: string = 'Unknown',
  additionalContext?: Record<string, any>
): CrmError {
  if (error instanceof CrmError) {
    return error;
  }

  if (error instanceof Error) {
    // Erro do Supabase
    if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
      return new CrmError(
        error.message,
        'AUTH_FAILED',
        401,
        'Sua sessão expirou. Faça login novamente.',
        { originalError: error.message, context, ...additionalContext }
      );
    }

    // Erro de validação
    if (error.message.includes('Invalid') || error.message.includes('invalid')) {
      return new CrmError(
        error.message,
        'VALIDATION_ERROR',
        400,
        'Dados inválidos. Verifique os campos preenchidos.',
        { originalError: error.message, context, ...additionalContext }
      );
    }

    // Erro de conexão
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      return new CrmError(
        error.message,
        'NETWORK_ERROR',
        503,
        'Erro de conexão. Verifique sua internet e tente novamente.',
        { originalError: error.message, context, ...additionalContext }
      );
    }

    // Erro genérico
    return new CrmError(
      error.message,
      'INTERNAL_ERROR',
      500,
      'Ocorreu um erro inesperado. Tente novamente ou contate o suporte.',
      { originalError: error.message, context, ...additionalContext }
    );
  }

  // String ou mensagem simples
  if (typeof error === 'string') {
    return new CrmError(
      error,
      'UNKNOWN_ERROR',
      500,
      'Ocorreu um erro inesperado.',
      { context, ...additionalContext }
    );
  }

  // Erro desconhecido
  return new CrmError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    'Ocorreu um erro inesperado.',
    { context, rawError: String(error), ...additionalContext }
  );
}

/**
 * Valida erros Supabase e retorna CrmError
 */
export function handleSupabaseError(
  error: any,
  operationName: string = 'Supabase Operation'
): CrmError {
  // Erro de autenticação/autorização
  if (error?.status === 401) {
    return new CrmError(
      `Autenticação falhou em ${operationName}`,
      'AUTH_UNAUTHORIZED',
      401,
      'Você não está autenticado. Faça login novamente.',
      { supabaseError: error }
    );
  }

  if (error?.status === 403) {
    return new CrmError(
      `Acesso negado em ${operationName}`,
      'AUTH_FORBIDDEN',
      403,
      'Você não tem permissão para acessar este recurso.',
      { supabaseError: error }
    );
  }

  // Erro de validação de dados
  if (error?.status === 400) {
    return new CrmError(
      `Validação falhou em ${operationName}: ${error?.message}`,
      'VALIDATION_ERROR',
      400,
      'os dados fornecidos são inválidos. Verifique os campos.',
      { supabaseError: error }
    );
  }

  // Erro de recurso não encontrado
  if (error?.status === 404) {
    return new CrmError(
      `Recurso não encontrado em ${operationName}`,
      'NOT_FOUND',
      404,
      'O recurso solicitado não foi encontrado.',
      { supabaseError: error }
    );
  }

  // Erro de conflito (unique constraint, etc)
  if (error?.status === 409) {
    return new CrmError(
      `Conflito em ${operationName}: ${error?.message}`,
      'CONFLICT',
      409,
      'Este registro já existe ou há conflito com outro dado.',
      { supabaseError: error }
    );
  }

  // Erro de servidor
  if (error?.status >= 500) {
    return new CrmError(
      `Erro do servidor em ${operationName}: ${error?.message}`,
      'SERVER_ERROR',
      error?.status || 500,
      'Servidor indisponível. Tente novamente em alguns instantes.',
      { supabaseError: error }
    );
  }

  // Erro genérico do Supabase
  return new CrmError(
    `Erro ao executar ${operationName}: ${error?.message || String(error)}`,
    'SUPABASE_ERROR',
    error?.status || 500,
    'Ocorreu um erro ao processar sua requisição.',
    { supabaseError: error }
  );
}

/**
 * Logger interno - centraliza todos os logs com prefix e formatação
 */
function logOperation(status: 'START' | 'SUCCESS' | 'ERROR', operationName: string, context?: Record<string, any>) {
  if (status === 'START') {
    console.log(`[CRM] ▶ ${operationName}${context ? ` | ${JSON.stringify(context)}` : ''}`);
  } else if (status === 'SUCCESS') {
    console.log(`[CRM] ✓ ${operationName} completed successfully`);
  }
}

/**
 * Log de erro com estrutura padronizada
 */
function logError(error: CrmError) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    context: error.context,
    stack: error.stack,
  };

  console.error('[CRM] ✗ Error:', errorLog);

  // Em produção, poderia enviar para serviço de logging
  if (process.env.NODE_ENV === 'production') {
    // TODO: Enviar para Sentry, LogRocket, etc
  }
}

/**
 * Retorna mensagem amigável padrão para código HTTP
 */
function getDefaultUserMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Dados inválidos. Verifique o preenchimento.',
    401: 'Sua sessão expirou. Faça login novamente.',
    403: 'Você não tem permissão para acessar isto.',
    404: 'Recurso não encontrado.',
    409: 'Este registro já existe.',
    500: 'Erro no servidor. Tente novamente.',
    503: 'Servidor indisponível. Tente novamente em instantes.',
  };

  return messages[statusCode] || 'Ocorreu um erro. Tente novamente.';
}

/**
 * Validador de cascade - verifica se pode deletar um recurso
 */
export async function validateCanDelete(
  tableName: string,
  resourceId: string,
  checkFn: () => Promise<number | null>
): Promise<void> {
  try {
    const relatedCount = await checkFn();

    if ((relatedCount || 0) > 0) {
      throw new CrmError(
        `Cannot delete ${tableName} ${resourceId}: ${relatedCount} related record(s) found`,
        'CASCADE_CONSTRAINT_VIOLATION',
        409,
        `Este ${tableName} possui ${relatedCount} registro(s) vinculado(s). Delete-os antes.`,
        { tableName, resourceId, relatedCount }
      );
    }
  } catch (error) {
    if (error instanceof CrmError) throw error;
    throw handleSupabaseError(error, `validateCanDelete(${tableName})`);
  }
}

/**
 * Executa operações em sequência com rollback em caso de erro
 * (simulação de transação, já que Supabase não suporta transações client-side)
 */
export async function executeSequential(
  operations: Array<{
    name: string;
    operation: () => Promise<any>;
    rollback?: () => Promise<void>;
  }>
): Promise<any[]> {
  const results: any[] = [];
  const executedOps: typeof operations = [];

  try {
    for (const op of operations) {
      console.log(`[CRM] Executando: ${op.name}`);
      const result = await op.operation();
      results.push(result);
      executedOps.push(op);
    }
    console.log(`[CRM] ✓ Todas as ${operations.length} operações executadas com sucesso`);
    return results;
  } catch (error) {
    console.error(`[CRM] ✗ Erro na operação. Iniciando rollback...`);

    // Rollback em ordem reversa
    for (const op of executedOps.reverse()) {
      try {
        if (op.rollback) {
          console.log(`[CRM] Revertendo: ${op.name}`);
          await op.rollback();
        }
      } catch (rollbackError) {
        console.error(`[CRM] Erro ao reverter ${op.name}:`, rollbackError);
      }
    }

    throw error;
  }
}
