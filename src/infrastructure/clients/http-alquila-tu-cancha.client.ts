import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { RedisService } from 'src/domain/services/redis.service';
import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private base_url: string;
  constructor(private httpService: HttpService, config: ConfigService, private redisService: RedisService) {
    this.base_url = config.get<string>('ATC_BASE_URL', 'http://localhost:4000');
  }

  async getClubs(placeId: string): Promise<Club[]> {
    const cacheKey = `clubs:${placeId}`;
    const cachedClubs = await this.redisService.get<Club[]>(cacheKey);
    if (cachedClubs) return cachedClubs;

    const clubs = await this.httpService.axiosRef
      .get('clubs', {
        baseURL: this.base_url,
        params: { placeId },
      })
      .then((res) => res.data);

    await this.redisService.set(cacheKey, clubs, 3600); // TTL de 1 hora
    return clubs;
  }

  async getCourts(clubId: number): Promise<Court[]> {
    const cacheKey = `courts:${clubId}`;
    const cachedCourts = await this.redisService.get<Court[]>(cacheKey);
    if (cachedCourts) return cachedCourts;

    const courts = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts`, { baseURL: this.base_url })
      .then((res) => res.data);

    await this.redisService.set(cacheKey, courts, 3600);
    return courts;
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    const cacheKey = `slots:${clubId}:${courtId}:${date.toISOString().split('T')[0]}`;
    const cachedSlots = await this.redisService.get<Slot[]>(cacheKey);
    if (cachedSlots) return cachedSlots;

    const slots = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts/${courtId}/slots`, {
        baseURL: this.base_url,
        params: { date: date.toISOString().split('T')[0] },
      })
      .then((res) => res.data);

    await this.redisService.set(cacheKey, slots, 3600);
    return slots;
  }
}
