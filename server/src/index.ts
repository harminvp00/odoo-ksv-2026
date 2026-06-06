import app from './app';
import env from './config/env';
import logger from './utils/logger';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`VendorBridge Server listening on port ${PORT}`);
});
