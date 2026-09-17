import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { LiquidButton, MetalButton } from '../src/components/ui/liquid-glass-button';

const html = renderToStaticMarkup(<>
  <LiquidButton>Sign in</LiquidButton>
  <LiquidButton asChild><a href="#rr-practice">Try playground</a></LiquidButton>
  <MetalButton disabled>Start learning</MetalButton>
</>);
const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, 2, 'Each liquid button has its own filter');
assert.equal(new Set(ids).size, 2, 'Filters must have unique IDs');
for (const id of ids) assert.ok(html.includes(`url(&quot;#${id}&quot;)`), 'Backdrop references its own filter');
assert.match(html, /<a[^>]*href="#rr-practice"/, 'asChild preserves the actual link');
assert.equal((html.match(/<button\b/g) || []).length, 2, 'Link must not be nested inside a button');
assert.match(html, /<button[^>]*disabled=""/, 'Disabled metal buttons remain natively disabled');
assert.match(html, /type="button"/, 'Actions must not accidentally submit a form');
assert.ok(!html.includes('<div'), 'Button internals use phrasing content');
console.log('Passed: unique filters, valid links, native disabled semantics and safe action types.');
