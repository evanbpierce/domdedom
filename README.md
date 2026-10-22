# domdedom

> Clean, declarative DOM querying using JavaScript Proxies and destructuring assignment.

Stop writing repetitive `document.getElementById` and `document.querySelector` boilerplate. `domdedom` turns DOM access into native-feeling object destructuring and dynamic function calls—with zero dependencies and no build steps required.

---

## Features

- **Declarative Destructuring**: Bind elements directly to variable names (`const { submitBtn, userForm } = DOM.id`).
- **Dual Invocation**: Every accessor supports both object property destructuring and direct functional invocation (`DOM.id('btn-' + id)`).
- **Zero Dependencies**: Native ES6 Proxy forwarding to browser DOM methods.
- **Under 1 KB**: Tiny footprint with virtually zero engine overhead.
- **Full TypeScript Support**: Shipped with comprehensive `.d.ts` definitions out of the box.

---

## Installation

```bash
npm install domdedom
```

Or install with Yarn / pnpm:

```bash
yarn add domdedom
# or
pnpm add domdedom
```

---

## Usage

### 1. Destructuring by ID

Instead of repetitive lookups:

```javascript
// Traditional boilerplate
const submitBtn = document.getElementById('submitBtn');
const username = document.getElementById('username');
const errorModal = document.getElementById('errorModal');
```

Write clean, declarative bindings:

```javascript
import { DOM } from 'domdedom';

const { submitBtn, username, errorModal } = DOM.id;
```

---

### 2. Destructuring Classes, Tags, and Names

Access live DOM collections (`HTMLCollection` and `NodeList`) using identical syntax:

```javascript
// Classes (HTMLCollection)
const { card, badge } = DOM.class;

// Tag names (HTMLCollection)
const { li, p, button } = DOM.tag;

// Name attributes (NodeList)
const { csrfToken } = DOM.name;
```

---

### 3. CSS Selectors with `qs` and `qsa`

Query single elements (`querySelector`) or node lists (`querySelectorAll`). For selectors with characters like `.`, `#`, `[`, or `>`, use standard JavaScript destructuring renaming syntax:

```javascript
// Simple tags map directly
const { body, header } = DOM.qs;

// Complex selectors unpack cleanly via alias renaming
const {
  '.nav-item.active': activeNav,
  'input[type="checkbox"]:checked': checkedBox
} = DOM.qs;

const {
  'ul > li': listItems,
  '.gallery img': galleryImages
} = DOM.qsa;
```

---

### 4. Dual Invocation (Calls + Properties)

Every helper in `domdedom` wraps a callable function target. That means you get static destructuring upfront and natural function execution in dynamic runtime expressions:

```javascript
// Static upfront destructuring
const { saveBtn, cancelBtn } = DOM.id;

// Direct dot property access
DOM.id.saveBtn.disabled = true;

// Dynamic expression calls (no computed brackets needed)
const dynamicCard = DOM.id('card-' + index);
const activeItem  = DOM.qs(`.list-item[data-id="${selectedId}"]`);
const buttons     = DOM.tag('button');
```

---

## API Reference

| Accessor | Native Method Dispatched | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `DOM.id` | `document.getElementById` | `HTMLElement \| null` | Matches element by `id` attribute |
| `DOM.class` | `document.getElementsByClassName` | `HTMLCollectionOf<Element>` | Live collection matching class name |
| `DOM.tag` | `document.getElementsByTagName` | `HTMLCollectionOf<Element>` | Live collection matching tag name |
| `DOM.name` | `document.getElementsByName` | `NodeList` | Live collection matching `name` attribute |
| `DOM.qs` | `document.querySelector` | `Element \| null` | First element matching CSS selector |
| `DOM.qsa` | `document.querySelectorAll` | `NodeListOf<Element>` | Static list of all matching elements |

---

## Important Considerations

1. **Evaluation Timing**: Destructuring executes the query at the exact line of execution. Ensure elements are loaded in the DOM (e.g., after `DOMContentLoaded` or component mount) before destructuring, otherwise the variables will bind to `null` or empty collections.
2. **Static vs. Live References**:
   - Variables destructured locally store the element reference from that moment:
     ```javascript
     const { modal } = DOM.id; // Bound once
     ```
   - Direct access or function calls re-query the document every time:
     ```javascript
     DOM.id.modal.showModal(); // Re-queried on access
     DOM.id('modal').showModal(); // Re-queried on invocation
     ```
3. **Performance**: Trap forwarding costs nanoseconds. DOM tree lookups and browser layout passes dominate runtime, so Proxy dispatch overhead is negligible in practice.

---

## TypeScript

TypeScript types are included with no extra `@types` package required:

```typescript
import { DOM } from 'domdedom';

// Typed as HTMLElement | null
const { submitBtn } = DOM.id;

// Typed as NodeListOf<Element>
const { 'ul > li': items } = DOM.qsa;

// Fully typed function invocation
const main = DOM.qs('#main');
```

---

## Browser Support

Works in all modern evergreen browsers (Chrome, Edge, Firefox, Safari) and any environment supporting ES6 Proxies and the standard DOM API.

---

## License

MIT © [Evan Pierce](https://github.com/your-username)