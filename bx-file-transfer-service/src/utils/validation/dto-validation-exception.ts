import { ValidationError } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class DtoValidationException extends RpcException {
  constructor(errors: ValidationError[]) {
    super(errors);
  }
}
