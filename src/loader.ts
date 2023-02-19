import { execute } from './utility';

export interface LoaderOptions {
	context: HTMLElement | null;
	margin: string;
	lazy: boolean;
	defer: boolean;
	observe: boolean;
	selector: (name: string) => string;
	excludes: string[];
}

export interface ElementOptions {
	lazy: boolean;
	defer: boolean;
}

export interface ElementDefinition {
	name: string;
	callable: () => Promise<CustomElementConstructor>;
	options: ElementOptions;
}

export default class Loader {
	private running: boolean = false;
	private readonly options: LoaderOptions;
	private readonly registry: Map<string, ElementDefinition>;
	private readonly intersector: IntersectionObserver;
	private readonly mutator: MutationObserver;

	public static defaults: LoaderOptions = {
		context: null,
		margin: '0%',
		lazy: true,
		defer: true,
		observe: true,
		selector: (name) => `${name}:not(:defined)`,
		excludes: ['html', 'head', 'meta', 'link', 'style', 'script', 'noscript', 'template'],
	};

	public constructor(options?: Partial<LoaderOptions>) {
		this.options = { ...Loader.defaults, ...options };
		this.registry = new Map();

		this.intersector = new IntersectionObserver(this.intersect.bind(this), {
			root: this.options.context,
			rootMargin: this.options.margin,
		});

		this.mutator = new MutationObserver(this.mutate.bind(this));
	}

	public define(name: string, callable: () => Promise<CustomElementConstructor>, options?: Partial<ElementOptions>): void {
		this.registry.set(name, {
			name,
			callable,
			options: {
				lazy: options?.lazy ?? this.options.lazy,
				defer: options?.defer ?? this.options.defer,
			},
		});

		if (this.running) {
			const context = this.options.context ?? window.document.documentElement;
			this.process(context, name);
		}
	}

	public run(): void {
		const context = this.options.context ?? window.document.documentElement;

		if (this.options.observe) {
			this.mutator.observe(context, {
				childList: true,
				subtree: true,
			});
		}

		this.process(context);

		this.running = true;
	}

	private process(context: HTMLElement, name?: string): void {
		const definitions = name ? [this.registry.get(name)] : [...this.registry.entries()];

		definitions.forEach((definition: ElementDefinition) => {
			if (definition.options?.lazy) {
				this.discover(context);
			} else {
				this.load(definition.name, false);
			}
		});
	}

	private discover(context: HTMLElement): void {
		this.registry.forEach((definition) => {
			const selector = this.options.selector(definition.name);
			const elements = [...context.querySelectorAll(selector)];

			if (context.matches(selector)) {
				elements.unshift(context);
			}

			if (elements.length > 0) {
				if (definition.options?.defer) {
					elements.forEach((element) => this.intersector.observe(element));
				} else {
					this.load(definition.name, false);
				}
			}
		});
	}

	private load(name: string, defer: boolean = true): void {
		const definition = this.registry.get(name);

		if (definition && !window.customElements.get(definition.name)) {
			execute(defer)(() => {
				definition.callable().then((constructor) => {
					if (constructor) {
						window.customElements.define(definition.name, constructor);
					}
				});
			});
		}
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
			const element = record.target as HTMLElement;
			const tag = element.tagName.toLowerCase();

			if (
				record.type === 'childList' &&
				record.target.nodeType === Node.ELEMENT_NODE &&
				!this.options.excludes?.includes(tag)
			) {
				for (let node of record.addedNodes) {
					this.process(node as HTMLElement);
				}
			}
		});
	}
}
