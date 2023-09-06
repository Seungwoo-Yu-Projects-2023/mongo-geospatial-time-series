import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { PedometerTotalType } from '@mongo/geospatial-time-series/apps/pedometers/schema';

export class PedometerTotal implements ToJSON<PedometerTotalType> {
  constructor(
    public readonly userUid: string,
    public readonly count: number,
  ) {}

  public toJSON(): PedometerTotalType {
    return this;
  }
}
