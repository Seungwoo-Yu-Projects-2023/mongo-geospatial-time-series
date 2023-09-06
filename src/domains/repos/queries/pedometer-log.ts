import { DateTime } from 'luxon';
import { PedometerTotal } from '@mongo/geospatial-time-series/domains/entities/pedometer-total';
import { PedometerPeriodic } from '@mongo/geospatial-time-series/domains/entities/pedometer-periodic';
import { PedometerDaily } from '@mongo/geospatial-time-series/domains/entities/pedometer-daily';

export interface PedometerLogQuery {
  findInDay(date: DateTime, userUid: string): Promise<PedometerDaily | undefined>,
  findBetween(
    start: DateTime,
    end: DateTime,
    userUid: string,
  ): Promise<PedometerPeriodic | undefined>,
  findTotal(userUid: string): Promise<PedometerTotal | undefined>,
}
