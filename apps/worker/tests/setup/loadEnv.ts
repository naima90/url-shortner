// Loads .env.test before anything else in the test run, mirroring
// apps/api/tests/setup/loadEnv.ts.
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
