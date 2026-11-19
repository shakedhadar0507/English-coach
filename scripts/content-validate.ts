import { bundle } from "../content";
import { validateBundle } from "../content/validate";

const { issues, checksum, counts } = validateBundle(bundle);
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");
for (const i of issues) console.log(`${i.severity.toUpperCase().padEnd(7)} ${i.entity}:${i.slug} [${i.code}] ${i.message}`);
console.log(`\ncounts: ${JSON.stringify(counts)}`);
console.log(`checksum: ${checksum}  errors: ${errors.length}  warnings: ${warnings.length}`);
if (errors.length) process.exit(1);
