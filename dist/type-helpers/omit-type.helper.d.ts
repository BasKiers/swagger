import { Type } from '@nestjs/common';
export declare function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[]
): Type<Omit<T, typeof keys[number]>>;
