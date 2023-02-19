import { execute } from './utility';

export interface Options {
	context?: HTMLElement;
	margin?: string;
	lazy?: boolean;
	defer?: boolean;
	observe?: boolean;
	excludes?: string[];
}

export interface ElementDefinition {
	name?: string;
	callable?: () => Promise<CustomElementConstructor>;
	options?: ElementOptions;
}

export interface ElementOptions {
	lazy?: boolean;
	defer?: boolean;
}

export default class Loader {
	private readonly options: Options;
	private readonly registry: Map<string, ElementDefinition>;
	private readonly intersector: IntersectionObserver;
	private readonly mutator: MutationObserver;

	public static defaults: Options = {
		margin: '0%',
		lazy: true,
		defer: true,
		observe: true,
		excludes: ['html', 'head', 'meta', 'link', 'style', 'script', 'noscript', 'template'],
	};

	public constructor(options?: Options) {
		this.options = { ...Loader.defaults, ...options };
		this.registry = new Map();

		this.intersector = new IntersectionObserver(this.intersect.bind(this), {
			root: this.options.context,
			rootMargin: this.options.margin,
		});

		this.mutator = new MutationObserver(this.mutate.bind(this));
	}

	public define(name: string, callable: () => Promise<CustomElementConstructor>, options?: ElementOptions): void {
		this.registry.set(name, {
			name,
			callable,
			options: {
				lazy: options?.lazy ?? this.options.lazy,
				defer: options?.defer ?? this.options.defer,
			},
		});

		// todo: load component immediately if loader is already initialized
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
	}

	private process(context: HTMLElement): void {
		this.registry.forEach((definition, name) => {
			if (!window.customElements.get(name)) {
				if (definition.options?.lazy) {
					this.discover(context);
				} else {
					this.load(name, false);
				}
			}
		});
	}

	private discover(context: HTMLElement): void {
		this.registry.forEach((definition, name) => {
			const selector = `${name}:not(:defined)`;
			const elements = [...context.querySelectorAll(selector)];

			if (context.matches(selector)) {
				elements.unshift(context);
			}

			if (elements.length > 0) {
				if (definition.options?.defer) {
					elements.forEach((element) => this.intersector.observe(element));
				} else {
					this.load(name, false);
				}
			}
		});
	}

	private load(name: string, defer: boolean = true): void {
		execute(defer)(() => {
			const definition = this.registry.get(name);

			if (definition && definition.callable) {
				definition.callable().then((constructor) => {
					if (constructor) {
						window.customElements.define(name, constructor);
					}
				});
			}
		});
	}

	private intersect(entries: IntersectionObserverEntry[]): void {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.load(entry.target.tagName.toLowerCase());

				// todo: remove elements with same tag-name from intersector
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
