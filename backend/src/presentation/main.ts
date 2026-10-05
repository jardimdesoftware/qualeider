import { NestFactory } from '@nestjs/core';
import { Logger, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { useContainer } from 'class-validator';
import { buildCorsOptions, createHelmetMiddleware } from './security.config';
import { configureTrustProxy } from './proxy.config';

/**
 * Caminhos expostos pelo Swagger (UI + specs raw), usados tanto para
 * registrar o SwaggerModule quanto para bloqueá-los explicitamente quando
 * SWAGGER_ENABLED=false.
 */
const SWAGGER_PATHS = [
  '/api-docs',
  '/api-docs/',
  '/api-docs-json',
  '/api-docs-yaml',
];

/**
 * Determina se o Swagger deve ser exposto neste ambiente.
 *
 * Habilitado por padrão (dev, simulação local com nginx e produção via
 * docker-compose.prod.yml todos expõem /api-docs pela mesma rota, atrás do
 * mesmo Nginx — ver README.md > "Swagger em produção"). Defina
 * SWAGGER_ENABLED=false no .env para desabilitar explicitamente, por
 * exemplo em um ambiente público onde não se deseja expor o schema da API.
 */
function isSwaggerEnabled(configService: ConfigService): boolean {
  const raw = configService.get<string>('SWAGGER_ENABLED');
  return raw === undefined || raw.trim().toLowerCase() !== 'false';
}

/**
 * Quando o Swagger está desabilitado, responde 403 nas rotas conhecidas em
 * vez de deixar cair no 404 padrão — evita a ambiguidade de "está fora do
 * ar" vs. "foi desabilitado de propósito" (ver issue de inconsistência de
 * /api-docs entre ambientes).
 */
function denySwaggerAccess(app: INestApplication): void {
  const httpAdapter = app.getHttpAdapter();
  const respondForbidden = (_req: unknown, res: any) => {
    res.status(403).json({
      statusCode: 403,
      error: 'Forbidden',
      message:
        'Documentação da API (Swagger) está desabilitada neste ambiente.',
    });
  };

  SWAGGER_PATHS.forEach((path) => httpAdapter.all(path, respondForbidden));
}

/**
 * Configura o Swagger (OpenAPI) para a documentação da API, respeitando a
 * flag SWAGGER_ENABLED.
 */
function setupSwagger(app: INestApplication, configService: ConfigService): void {
  if (!isSwaggerEnabled(configService)) {
    denySwaggerAccess(app);
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Sistema QuaLeiDer')
    .setDescription(
      'API para gerenciamento de usuários, animais e coletas diárias de leite',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

/**
 * Obtém a porta da aplicação a partir das variáveis de ambiente com um fallback.
 */
function getAppPort(configService: ConfigService): number {
  const fromConfig = configService.get<string>('PORT');
  const fromEnv = process.env.PORT;
  const portStr = fromConfig ?? fromEnv ?? '8080';
  const port = parseInt(portStr, 10);
  return Number.isFinite(port) ? port : 8080;
}

/**
 * Exibe logs informativos sobre o status da aplicação no console.
 */
async function logAppStatus(
  app: INestApplication,
  corsOptions: CorsOptions,
  swaggerEnabled: boolean,
  trustedProxyHops: number,
): Promise<void> {
  const appUrl = await app.getUrl();

  const formatOrigin = (origin: CorsOptions['origin']): string => {
    if (origin === true || origin === '*') return '* (todas as origens)';
    if (origin === false) return 'nenhuma origem cross-origin';
    if (Array.isArray(origin)) return origin.join(', ');
    return String(origin);
  };

  Logger.log(`Servidor rodando em ${appUrl}`, 'Bootstrap');
  Logger.log(
    swaggerEnabled
      ? `Documentação da API disponível em ${appUrl}/api-docs`
      : `Documentação da API (Swagger) desabilitada (SWAGGER_ENABLED=false) — /api-docs responde 403`,
    'Bootstrap',
  );
  Logger.log(
    `CORS habilitado para: ${formatOrigin(corsOptions.origin)}`,
    'Bootstrap',
  );
  Logger.log(
    trustedProxyHops > 0
      ? `Proxy confiável: ${trustedProxyHops} salto(s) (TRUST_PROXY_HOPS) — IP do cliente vem do X-Forwarded-For`
      : 'Proxy confiável: nenhum (TRUST_PROXY_HOPS=0) — IP do cliente é o da conexão',
    'Bootstrap',
  );
}

/**
 * Função principal que inicializa a aplicação NestJS.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  // IP real do cliente atrás do nginx (rate limit de rotas públicas por IP).
  const trustedProxyHops = configureTrustProxy(app, configService);

  // Habilitar injeção de dependências em validadores customizados do class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Helmet com CSP estrita para a API (JSON) e uma mais permissiva só para o Swagger UI
  app.use(createHelmetMiddleware());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 1. Configurar CORS
  const { options: corsOptions, warnings: corsWarnings } = buildCorsOptions(
    configService.get<string>('CORS_ORIGINS'),
    configService.get<string>('NODE_ENV') === 'production',
  );
  corsWarnings.forEach((warning) => Logger.warn(warning, 'Bootstrap'));
  app.enableCors(corsOptions);

  // 2. Configurar filtros globais
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3. Configurar prefixo global
  app.setGlobalPrefix('api');

  // 4. Configurar Swagger
  const swaggerEnabled = isSwaggerEnabled(configService);
  setupSwagger(app, configService);

  // 4. Iniciar o servidor
  const port = getAppPort(configService);
  await app.listen(port, '0.0.0.0');

  // 5. Logar o status da aplicação
  await logAppStatus(app, corsOptions, swaggerEnabled, trustedProxyHops);
}

bootstrap();
