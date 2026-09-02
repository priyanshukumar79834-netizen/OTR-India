import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { otrProfileRouter } from './modules/otr-profile/otrProfile.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // --- Foundation-owned routes ---
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/otr/profile', otrProfileRouter);

  // --- Reserved mount points for the other three modules ---
  // Harsh:  app.use('/api/interop', interopRouter)     — government portal connectors
  // Adi:    consumes these APIs from the frontend, no backend routes owned here
  // Anchal: app.use('/api/consent', consentRouter)
  //         app.use('/api/applications', applicationsRouter)
  // Mount them here once each module lands, rather than inventing a
  // separate Express app per module.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
