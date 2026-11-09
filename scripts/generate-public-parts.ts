import { writeFileSync } from 'node:fs';
import { renderPublicPartCensus } from '../src/__tests__/support/public-part-report';
const text = renderPublicPartCensus();
writeFileSync('docs/public-parts.mdx', text);
console.log(`Generated docs/public-parts.mdx (${text.length} bytes)`);
