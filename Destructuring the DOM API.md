# Destructuring the DOM API

[![npm version](https://img.shields.io/npm/v/domdedom.svg?style=flat-square)](https://www.npmjs.com/package/domdedom)
[![bundle size](https://img.shields.io/bundlephobia/minzip/domdedom?style=flat-square)](https://bundlephobia.com/package/domdedom)
[![npm downloads](https://img.shields.io/npm/dm/domdedom.svg?style=flat-square)](https://www.npmjs.com/package/domdedom)
[![license](https://img.shields.io/npm/l/domdedom.svg?style=flat-square)](LICENSE.md)

**By Gemini and Evan Pierce**
*Author's note: While Gemini wrote this article, Evan Pierce provided the architectural ideas, core patterns, and editorial direction.*

---

We use destructuring assignment everywhere in modern JavaScript: unpacking properties from objects, results from array tuples, and options from configuration payloads.

Yet, when interacting with the DOM, we are still stuck writing imperative boilerplate from 1998:

```javascript
const submitBtn = document.getElementById('submitBtn');
const usernameInput = document.getElementById('username');
const errorModal = document.getElementById('errorModal');
```

What if querying the DOM looked like this instead?

```javascript
const { submitBtn, username, errorModal } = DOM.id;
```

With a few strategic lines of JavaScript, we can turn the entire browser querying suite into clean, declarative object lookups—with zero runtime dependencies and zero framework overhead.

---

### The Engine: A Single-Line Property Interceptor

To make the DOM feel like an object we can destructure, we don't need a heavy abstraction layer. We only need a lightweight bridge to intercept property reads and route them to native browser methods.

JavaScript’s ES6 `Proxy` does this cleanly in a single line:

```javascript
const byId = new Proxy({}, { get: (_, id) => document.getElementById(id) });
```

When destructuring triggers `byId.submitBtn`, the Proxy intercepts the key `'submitBtn'`, immediately delegates it to `document.getElementById('submitBtn')`, and binds the returned node to your local variable.

You can also use it inline within expressions:
* Dot notation: `byId.submitBtn.focus();`
* Computed property access: `byId[action + 'Btn'].disabled = true;`

> **A Quick Note on Performance:**
> Developers often hesitate around Proxies due to concerns about trap overhead inside tight CPU loops. Here, that concern does not apply. The runtime cost of any DOM operation is dominated by browser layout engines and C++ tree traversals. The microsecond cost of an intercepted property read is completely imperceptible compared to the DOM lookup itself.

---

### Expanding Across the DOM Query Suite

The exact same pattern applies across the rest of the browser's native query methods:

#### 1. Classes, Tags, and Names (`HTMLCollection` / Live Lists)

```javascript
const byClass = new Proxy({}, { get: (_, c) => document.getElementsByClassName(c) });
const byTag   = new Proxy({}, { get: (_, t) => document.getElementsByTagName(t) });
const byName  = new Proxy({}, { get: (_, n) => document.getElementsByName(n) });

// Usage
const { card, badge } = byClass;
const { li, p } = byTag;
const { csrfToken } = byName;
```

---

#### 2. `querySelector` & `querySelectorAll`

```javascript
const qs  = new Proxy({}, { get: (_, q)  => document.querySelector(q) });
const qsa = new Proxy({}, { get: (_, qa) => document.querySelectorAll(qa) });
```

Because CSS selectors frequently contain characters that are not valid JavaScript variable names (such as `.`, `#`, `[`, or `>`), destructuring handles them using standard alias renaming syntax:

```javascript
// Simple tag selectors map directly
const { body, header } = qs;

// Complex selectors unpack cleanly via renaming
const {
  '.nav-item.active': activeNav,
  'input[type="checkbox"]:checked': checkedBox
} = qs;

const {
  'ul > li': listItems,
  '.gallery img': galleryImages
} = qsa;
```

---

### Unifying Under One Namespace

Rather than cluttering scope with individual helpers, group them into a single, cohesive `DOM` namespace:

```javascript
const DOM = {
  id:    new Proxy({}, { get: (_, id) => document.getElementById(id) }),
  class: new Proxy({}, { get: (_, c)  => document.getElementsByClassName(c) }),
  tag:   new Proxy({}, { get: (_, t)  => document.getElementsByTagName(t) }),
  name:  new Proxy({}, { get: (_, n)  => document.getElementsByName(n) }),
  qs:    new Proxy({}, { get: (_, q)  => document.querySelector(q) }),
  qsa:   new Proxy({}, { get: (_, qa) => document.querySelectorAll(qa) }),
};

// Clean, contextual destructuring
const { submitBtn, userForm } = DOM.id;
const { '.alert-danger': alertBox } = DOM.qs;
const { row } = DOM.class;
const { 'ul > li': listItems } = DOM.qsa;
```

---

### Beyond Destructuring: Dynamic Function Calls

Destructuring is ideal for upfront static element declarations at the top of a module or component. But what happens when you need to query an element dynamically inside an event handler using runtime variables?

Writing computed brackets like `DOM.id[action + 'Btn']` works, but calling `DOM.id(action + 'Btn')` or `DOM.qs('.item:first-child')` feels much more natural.

By default, wrapping a plain object (`{}`) causes `DOM.id('main')` to throw `TypeError: DOM.id is not a function`.

Can a single construct support both function calls and object destructuring?
**YES! Functions CAN have properties since they are first-class objects.**

Because JavaScript functions are callable objects, a Proxy wrapping a function target can intercept both execution (via the `apply` trap) and property access (via the `get` trap):

```javascript
const byId = new Proxy(() => {}, {
  apply: (_, __, [id]) => document.getElementById(id),
  get:   (_, id)       => document.getElementById(id)
});
```

#### The Upgraded `DOM` Namespace

Instead of repeating these traps for every method, we can abstract the construction into a clean helper factory `p`. This provides uniform dual functionality across the entire namespace—destructure when declaring upfront, invoke directly when querying dynamically:

```javascript
const p = fn =>
  new Proxy(() => {}, {
    apply: (_, __, [arg]) => fn(arg),
    get: (_, arg) => fn(arg)
  });

export const DOM = {
  id: p(id => document.getElementById(id)),
  class: p(c => document.getElementsByClassName(c)),
  tag: p(t => document.getElementsByTagName(t)),
  name: p(n => document.getElementsByName(n)),
  qs: p(q => document.querySelector(q)),
  qsa: p(qa => document.querySelectorAll(qa))
};

export default DOM;
```

#### Clean Ergonomics in Action

Now you get total flexibility without sacrificing conciseness:

```javascript
// 1. Static upfront destructuring
const { submitBtn, cancelBtn } = DOM.id;
const { '.active-tab': activeTab } = DOM.qs;

// 2. Property access
DOM.id.submitBtn.disabled = false;

// 3. Dynamic runtime expressions
const currentCard = DOM.id(action + 'Btn');
const activeItem  = DOM.qs(`.list-item[data-id="${selectedId}"]`);
const allButtons  = DOM.tag('button');
```

---

### Crucial Behaviors to Keep in Mind

1. **A Pragmatic Balance on DRY:**
   Admittedly, destructuring isn't 100% DRY in every scenario—when renaming complex selectors like `const { '.item.active': activeItem } = DOM.qs;`, you are still repeating the identifier concept across the colon. However, in the vast majority of everyday code where variable names match element IDs, tags, or simple classes (`const { submitBtn, userForm } = DOM.id`), the ergonomics become substantially more DRY. You ditch repetitive `document.getElementById(...)` calls and declare each binding once.

2. **Kebab-Case IDs vs. Identifier Syncing:**
   HTML has historically favored kebab-case (`id="submit-btn"`), but hyphens are invalid in unquoted JavaScript variable names. When querying an ID with a dash, you are typically forced to alias it:
   ```javascript
   const { 'submit-btn': submitBtn } = DOM.id;
   ```
   While aliasing works, it breaks the seamless 1:1 identifier match. For newly authored markup, adopting JavaScript's standard **camelCase** (`id="submitBtn"`) is ideal because it matches language conventions and destructures without aliases.

   **What if you're stuck with existing hyphenated IDs?**
   If you are working with an existing codebase or template where changing the HTML isn't an option, you don't have to surrender to alias boilerplate. A slightly modified proxy handler can bridge the gap by automatically mapping underscores to dashes:
   ```javascript
   const byId = new Proxy({}, {
     get: (_, id) => document.getElementById(id.replaceAll('_', '-'))
   });
   ```
   Now valid JavaScript identifiers unpack legacy hyphenated elements directly:
   ```javascript
   // Automatically queries document.getElementById('submit-btn') and 'error-banner'
   const { submit_btn, error_banner } = byId;
   ```

3. **Native Error Forwarding:** Passing parameters straight into the underlying methods lets the browser handle coercion and errors naturally. If you pass an invalid selector to `DOM.qs(q)`, it throws a native `DOMException` without being masked by custom error handlers.
4. **Evaluation Timing:** Destructuring queries the DOM at the exact moment the declaration executes. If your elements haven't mounted yet (e.g., executing before `DOMContentLoaded`), variables will bind to `null` or empty live collections.
5. **Static References vs. Live Queries:**
   - **Destructured variables** store a static reference evaluated at execution time:
     ```javascript
     const { card } = DOM.id; // Evaluated once and bound locally
     ```
   - **Direct property reads and calls** re-query the DOM every single time:
     ```javascript
     DOM.id.card.classList.add('active'); // Queries on access
     DOM.id('card').classList.add('active'); // Queries on invocation
     ```

---

### Try It Out: Available on npm

You don't need to manually wire up these traps across your projects. The entire dual-invocation suite is packaged as a zero-dependency micro-utility published under **`domdedom`**:

```bash
npm install domdedom
```

```javascript
import { DOM } from 'domdedom';

// Destructure or invoke immediately
const { mainContent, saveBtn } = DOM.id;
const activeRow = DOM.qs('.row.selected');
```

---

### Conclusion

Destructuring assignment redefined how we write modern JavaScript everywhere else in our codebases. By leveraging JavaScript's first-class function mechanics, we can bring that same clean, expressive ergonomics to the DOM API without adding runtime bloat.

The careful observer will also notice that this pattern isn't limited to DOM nodes. Any API based on getter methods, key-value stores, or string-based lookup registries—from Web Storage (`localStorage`) and environment variables to URL search parameters and cache layers—can be reshaped using the exact same technique. And that world keeps going from there, if you're willing to explore a bit.