export interface LoaderOptions {
	context?: HTMLElement;
	init?: boolean;
	contextual?: boolean;
	defer?: boolean;
	observe?: boolean;
	define?: boolean;
	margin?: string;
	selector?: (name: string) => string;
	ignore?: string[];
}

export interface ElementDefinition {
	name: string;
	callable: ElementCallable;
	options: Required<ElementOptions>;
	value?: CustomElementConstructor;
}

export interface ElementOptions {
	contextual?: boolean;
	defer?: boolean;
	define?: boolean;
	selector?: (name: string) => string;
}

export interface ElementDefinitionList {
	[name: string]: ElementCallable | Omit<ElementDefinition, 'name'>;
}

export type ElementCallable = () => Promise<CustomElementConstructor>;
