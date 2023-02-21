# Web Component Loader
> Utility for lazy-loading web components.

`Web Component Loader` uses the `IntersectionObserver` API to defer loading components until they enter the viewport.
It also uses the `MutationObserver` API to observe the DOM for newly inserted components.
This allows to dynamically insert components into the DOM and have them loaded automatically.

- 📦 **small**: 1.5kb minified
- 🚀 **fast**: Uses IntersectionObserver to defer loading components
- 🧩 **flexible**: Provides a class and a function for loading components
- 🎨 **customizable**: Define various options for loading components

## Setup

```shell
npm install @somehow-digital/web-component-loader
```

## Usage

`Web Component Loader` provides a class and a function for loading components.
The utility function is a wrapper around the class. The class is more flexible,
but the function is more convenient.

**Class**

The class is a wrapper around the `customElements.define` function. It allows
you to define components and then run the loader. This is useful if you want
to define components in one place and then run the loader in another.

```typescript
import Loader from '@somehow-digital/web-component-loader';

const loader = new Loader(/* options */);
loader.define('component-one', () => import('component-one.js'));
loader.define('component-two', () => import('component-two.js'), /* options */);
```

**Function**

The function returns a function that can be called to run the loader.
This is useful to run the loader independently of the component definitions.

```typescript
import { define } from '@somehow-digital/web-component-loader';

define({
  'component-one': () => import('component-one.js'),
  'component-two': [() => import('component-two.js'), /* options */],
})(/* options */);
```

### Options

Options can be passed to the `define` function or the `Loader` class.
Options can be set globally or some can be set per component definition.
See file `loader.ts` for the default values.

| Option       | Type          | Default    | Global | Element | Description                                                   |
|--------------|---------------|------------|:------:|:-------:|---------------------------------------------------------------|
| `context`    | `HTMLElement` | `document` |   ✅    |         | The DOM context to search for components in.                  |
| `init`       | `boolean`     | `true`     |   ✅    |         | Whether to run the loader immediately.                        |
| `contextual` | `boolean`     | `true`     |   ✅    |    ✅    | Whether to load components found in the DOM context.          |
| `defer`      | `boolean`     | `true`     |   ✅    |    ✅    | Whether to defer loading components on entering the viewport. |
| `observe`    | `boolean`     | `true`     |   ✅    |         | Whether to observe the DOM for newly inserted components.     |
| `margin`     | `string`      | `0px`      |   ✅    |         | The margin used when loading deferred elements.               |
| `selector`   | `function`    | `...`      |   ✅    |    ✅    | Selector to use when searching for components.                |
| `excludes`   | `string[]`    | `[...]`    |   ✅    |         | An array of element names to exclude from processing.         |

---

[`somehow.digital`](https://somehow.digital/)
