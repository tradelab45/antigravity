import React from 'react';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageSkeleton } from '../src/components/PageSkeleton';

for (const page of ['markets', 'portfolio', 'academy'] as const) {
  const html = renderToStaticMarkup(<PageSkeleton page={page} />);
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes('aria-hidden="true"'));
  assert.ok(html.includes('motion-safe:animate-pulse'));
  assert.ok(html.includes(`Loading ${page[0].toUpperCase()}${page.slice(1)}`));
}

type Chunk = { file: string; imports?: string[]; isEntry?: boolean; dynamicImports?: string[] };
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<string, Chunk>;
const entry = Object.keys(manifest).find(key => manifest[key].isEntry)!;
const initial = new Set<string>();
function visit(key: string) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
visit(entry);
for (const component of ['AuthPage', 'Header', 'MarketScreener', 'PortfolioView', 'WatchlistView', 'InvestorAcademy']) {
  const key = Object.keys(manifest).find(key => key.endsWith(`/${component}.tsx`));
  assert.ok(key, `${component} must have a separate chunk`);
  assert.ok(!initial.has(key), `${component} must not be in the initial static import graph`);
}
console.log('PASS: all three accessible skeletons render; six feature chunks are outside the initial import graph.');
console.log('Initial static chunks:', [...initial].map(key => manifest[key].file));
