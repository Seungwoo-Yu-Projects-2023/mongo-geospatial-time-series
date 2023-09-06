import { Model, Schema } from 'mongoose';
import { Area, Coordinates, RectPolygon as RectPolygonType } from '@mongo/geospatial-time-series/types';

export class Point2D {
  public readonly type = 'Point';

  constructor(
    public readonly coordinates: Coordinates,
  ) {}
}

export type Point2DModel = Model<Point2D>;
export const pointSchema: Schema<Point2D, Point2DModel> = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

export class RectPolygon {
  public readonly type = 'Polygon';
  public readonly coordinates: RectPolygonType;

  constructor(area: Area) {
    this.coordinates = [[
      // Top-left
      [area[0][0], area[0][1]],
      // Top-right
      [area[1][0], area[0][1]],
      // Bottom-right
      [area[1][0], area[1][1]],
      // Bottom-left
      [area[0][0], area[1][1]],
      // Top-left
      [area[0][0], area[0][1]],
    ]];
  }
}
