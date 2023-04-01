import "reflect-metadata";

import * as dotenv from "dotenv";

dotenv.config();

import { bootstrap } from "./bootstrap.js";

bootstrap().catch(console.error);
