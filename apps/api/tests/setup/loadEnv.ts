// Loads .env.test before anything else in the test run.
// The `test` npm script also passes -e .env.test via dotenv-cli, but loading it
// here too means running jest directly still gets the test config.
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
