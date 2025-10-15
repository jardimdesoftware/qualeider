import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });

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

  await app.listen(8080);
}

bootstrap();
