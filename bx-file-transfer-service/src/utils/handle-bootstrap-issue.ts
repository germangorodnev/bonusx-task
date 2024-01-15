import { logger } from '../configs/logger';

export function handleBootstrapIssue(error) {
  logger.error(error);
  process.exit(2);
}
