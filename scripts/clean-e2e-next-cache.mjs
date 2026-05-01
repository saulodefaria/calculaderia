import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(join(process.cwd(), ".next-e2e"), { recursive: true, force: true });
