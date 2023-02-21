import { execute } from './utility';
import { LoaderOptions, ElementDefinition, ElementOptions, ElementCallable } from './types';

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

	public constructor(options: Omit<LoaderOptions, 'context'> = {}) {
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
		const definition = {
			name,
			callable,
			options: {
				contextual: options.contextual ?? this.options.contextual,
				defer: options.defer ?? this.options.defer,
			},
		};

		this.registry.set(name, definition);

		if (this.running) {
			this.discover(this.options.context, [definition]);
		}
	}

	public run(): void {
		if (!this.running && this.options.observe) {
			this.mutator.observe(this.options.context, {
				childList: true,
				subtree: true,
			});
		}

		this.discover(this.options.context, [...this.registry.values()]);

		this.running = true;
	}

	public destroy(): void {
		this.running = false;

		this.registry.clear();
		this.mutator.disconnect();
		this.intersector.disconnect();
	}

	private discover(context: HTMLElement, definitions: ElementDefinition[]): void {
		definitions.forEach((definition) => {
			if (definition.options.contextual) {
				const selector = this.options.selector(definition.name);
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
						this.load(definition, false);
					}
				}
			} else {
				this.load(definition, false);
			}
		});
	}

	private load(definition: ElementDefinition, defer = true): void {
		if (!window.customElements.get(definition.name)) {
			execute(defer)(async () => {
				const constructor = await definition.callable();

				if (constructor) {
					window.customElements.define(definition.name, constructor);
				}
			});
		}
	}

	private intersect(entries: IntersectionObserverEntry[]): void {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const definition = this.registry.get(entry.target.tagName.toLowerCase());

				this.intersector.unobserve(entry.target);

				if (definition) {
					this.load(definition);
				}
			}
		});
	}

	private mutate(records: MutationRecord[]): void {
		const definitions = [...this.registry.values()];

		records.forEach((record) => {
			if (record.type === 'childList') {
				record.addedNodes.forEach((node: HTMLElement) => {
					if (node.nodeType === Node.ELEMENT_NODE && !this.options.ignore?.includes(node.tagName.toLowerCase())) {
						this.discover(node as HTMLElement, definitions);
					}
				});
			}
		});
	}
}
