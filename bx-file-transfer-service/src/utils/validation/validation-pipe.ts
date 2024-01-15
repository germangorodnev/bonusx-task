import { ValidationError, ValidationPipe } from '@nestjs/common';

import { DtoValidationException } from './dto-validation-exception';

const exceptionFactory = function (errors: ValidationError[]) {
  return new DtoValidationException(errors);
};

export const globalValidationPipe = new ValidationPipe({
  transform: true,
  enableDebugMessages: true,
  exceptionFactory,
});
