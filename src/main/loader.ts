import {ElementCallable, ElementDefinition, ElementOptions, LoaderOptions} from '../types.js';

export default class Loader {
	private running: boolean = false;
	private readonly options: Required<LoaderOptions>;
	private readonly registry: Map<string, ElementDefinition>;
	private readonly intersector: IntersectionObserver;
	private readonly mutator: MutationObserver;

	private static readonly defaults: Required<LoaderOptions> = {
		context: window.document.documentElement,
		init: true,
		contextual: true,
		defer: true,
		observe: true,
		margin: '0%',
		selector: (name) => `${name}:not(:defined)`,
		ignore: ['html', 'head', 'meta', 'link', 'style', 'script', 'noscript', 'template'],
	};

	public constructor(options: LoaderOptions= {}) {
		this.options = { ...Loader.defaults, ...options };
		this.registry = new Map();

		this.intersector = new IntersectionObserver(this.intersect.bind(this), {
			rootMargin: this.options.margin,
		} as IntersectionObserverInit);

		this.mutator = new MutationObserver(this.mutate.bind(this));

		if (this.options.init) {
			this.run();
		}
	}

	public define(name: string, callable: ElementCallable, options: ElementOptions = {}): void {
		const definition: ElementDefinition = {
			name,
			callable,
			options: {
				contextual: options.contextual ?? this.options.contextual,
				defer: options.defer ?? this.options.defer,
				selector: options.selector ?? this.options.selector,
			},
		};

		this.registry.set(name, definition);

		if (this.running) {
			this.discover(this.options.context, [definition]);
		}
	}

	public load(name: string): Promise<CustomElementConstructor> {
		const definition = this.registry.get(name);

		if (definition) {
			return this.import(definition);
		}

		return Promise.reject(new Error(`Definition for element "${name}" is not defined.`));
	}

	public run(): void {
		if (!this.running && this.options.observe) {
			this.mutator.observe(this.options.context, {
				childList: true,
				subtree: true,
			});
		}

		this.discover(this.options.context);

		this.running = true;
	}

	public destroy(): void {
		this.running = false;

		this.mutator.disconnect();
		this.intersector.disconnect();
		this.registry.clear();
	}

	private discover(context: HTMLElement, list?: ElementDefinition[]): void {
		const definitions = list ?? [...this.registry.values()];

		definitions.forEach((definition) => {
			if (definition.options.contextual) {
				const selector = definition.options.selector(definition.name);
				const elements = [...context.querySelectorAll(selector)];

				if (context.matches(selector)) {
					elements.unshift(context);
				}

				if (elements.length > 0) {
					if (definition.options?.defer) {
						elements.forEach((element) => {
							this.intersector.observe(element);
						});
					} else {
						this.load(definition.name);
					}
				}
			} else {
				this.load(definition.name);
			}
		});
	}

	private import(definition: ElementDefinition): Promise<CustomElementConstructor> {
		return new Promise<CustomElementConstructor>((resolve, reject) => {
			if (definition.value) {
				resolve(definition.value);
			} else {
				definition.callable().then((constructor) => {
					if (constructor) {
						definition.value = constructor;
						window.customElements.define(definition.name, constructor);
						resolve(constructor);
					}

					reject();
				});
			}
		});
	}

	private intersect(entries: IntersectionObserverEntry[]): void {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.intersector.unobserve(entry.target);
				this.load(entry.target.tagName.toLowerCase());
			}
		});
	}

	private mutate(records: MutationRecord[]): void {
		records.forEach((record) => {
			if (record.type === 'childList') {
				record.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE && !this.options.ignore?.includes((node as HTMLElement).tagName.toLowerCase())) {
						this.discover(node as HTMLElement);
					}
				});
			}
		});
	}
}
