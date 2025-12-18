import { NestFactory } from '@nestjs/core';
import { Logger, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';

/**
 * Configura as opções de CORS baseadas nas variáveis de ambiente.
 */
function configureCors(configService: ConfigService): CorsOptions {
  const corsEnv = configService.get<string>('CORS_ORIGINS');
  let origin: CorsOptions['origin'] = 'http://localhost:3000'; // Default

  if (corsEnv) {
    if (corsEnv === '*' || corsEnv.toLowerCase() === 'true') {
      origin = true; // Permite todas as origens
    } else {
      const originsList = corsEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      
      // Garante suporte ao localhost:3000 (Frontend Local)
      if (!originsList.includes('http://localhost:3000')) {
        originsList.push('http://localhost:3000');
      }
      
      origin = originsList;
    }
  }

  return {
    origin,
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  };
}

/**
 * Configura o Swagger (OpenAPI) para a documentação da API.
 */
function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Sistema QuaLeiDer')
    .setDescription(
      'API para gerenciamento de usuários, animais e coletas diárias de leite',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
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
): Promise<void> {
  const appUrl = await app.getUrl();

  const formatOrigin = (origin: CorsOptions['origin']): string => {
    if (origin === true) return '* (todas as origens)';
    if (Array.isArray(origin)) return origin.join(', ');
    return String(origin);
  };

  Logger.log(`Servidor rodando em ${appUrl}`, 'Bootstrap');
  Logger.log(`Documentação da API disponível em ${appUrl}/api`, 'Bootstrap');
  Logger.log(
    `CORS habilitado para: ${formatOrigin(corsOptions.origin)}`,
    'Bootstrap',
  );
}

/**
 * Função principal que inicializa a aplicação NestJS.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  // Configurar Helmet para segurança HTTP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger precisa de 'unsafe-inline' e 'unsafe-eval' para funcionar corretamente
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 1. Configurar CORS
  const corsOptions = configureCors(configService);
  app.enableCors(corsOptions);

  // 2. Configurar filtros globais
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3. Configurar prefixo global
  app.setGlobalPrefix('api');

  // 4. Configurar Swagger
  setupSwagger(app);

  // 4. Iniciar o servidor
  const port = getAppPort(configService);
  await app.listen(port, '0.0.0.0');

  // 5. Logar o status da aplicação
  await logAppStatus(app, corsOptions);
}

bootstrap();
