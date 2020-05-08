import { Type } from '@nestjs/common';
export declare function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[]
): Type<Pick<T, typeof keys[number]>>;
