import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost'; // Valor predeterminado si REDIS_HOST no está definido
    const port = parseInt(process.env.REDIS_PORT || '6379', 10); // Valor predeterminado para REDIS_PORT

    this.client = new Redis({
      host,
      port,
    });
  }

  async onModuleInit() {
    console.log('Conectando a Redis...');
    this.client.on('connect', () => console.log('Redis conectado.'));
    this.client.on('error', (err) => console.error('Error en Redis:', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('Conexión a Redis cerrada.');
  }

  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlInSeconds) {
      await this.client.set(key, serializedValue, 'EX', ttlInSeconds);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}


