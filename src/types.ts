export interface LoaderOptions {
	context?: HTMLElement;
	init?: boolean;
	contextual?: boolean;
	defer?: boolean;
	observe?: boolean;
	margin?: string;
	selector?: (name: string) => string;
	ignore?: string[];
}

export interface ElementDefinition {
	name: string;
	callable: ElementCallable;
	options: ElementOptions;
}

export interface ElementOptions {
	contextual?: boolean;
	defer?: boolean;
}

export interface ElementDefinitionList {
	[name: string]: ElementCallable | Omit<ElementDefinition, 'name'>;
}

export type ElementCallable = () => Promise<CustomElementConstructor>;
