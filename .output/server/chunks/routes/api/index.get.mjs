import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { d as fetchProducts } from '../../_/products.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'node:fs/promises';
import '../../_/vendors.mjs';
import 'node:child_process';
import 'node:util';

const index_get = defineEventHandler(async (event) => {
  return await fetchProducts(event);
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
