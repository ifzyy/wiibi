/**
 * Storage provider factory.
 *
 * Reads STORAGE_PROVIDER env var and returns the matching provider.
 * Defaults to "local" when the var is not set.
 *
 * Adding a new provider:
 *   1. Create <name>.provider.js that exports an object with saveFile / deleteFile
 *   2. Add it to the PROVIDERS map below
 *   3. Set STORAGE_PROVIDER=<name> in .env
 */

import { localProvider }        from "./local.provider.js";
import { digitalOceanProvider } from "./digitalocean.provider.js";

const PROVIDERS = {
  local:         localProvider,
  digitalocean:  digitalOceanProvider,
};

const name = (process.env.STORAGE_PROVIDER || "local").toLowerCase();

if (!PROVIDERS[name]) {
  throw new Error(
    `Unknown STORAGE_PROVIDER: "${name}". Allowed values: ${Object.keys(PROVIDERS).join(", ")}`
  );
}

export default PROVIDERS[name];
