import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { createServer } from "http";
import express from "express";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useWebSocketAdapter(new IoAdapter(httpServer));

  const config = new DocumentBuilder()
    .setTitle("Games Service")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  await app.init();

  const port = Number(process.env.PORT) || 4001;
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Games service running on port ${port}`);
  });
}

bootstrap();
