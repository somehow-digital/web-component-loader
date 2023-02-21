import Loader, { LoaderOptions, ElementDefinition, ElementCallable } from './loader';

interface ElementDefinitionList {
	[name: string]: ElementCallable | Omit<ElementDefinition, 'name'>;
}

export default function define(definitions: ElementDefinitionList): (options?: LoaderOptions) => Loader {
	return (options: LoaderOptions = {}) => {
		const loader = new Loader({...options, init: false });

		Object.entries(definitions).forEach(([name, definition]) => {
			const [callable, options] = Array.isArray(definition) ? definition : [definition];
			loader.define(name, callable, options);
		});

		loader.run();

		return loader;
	};
}
