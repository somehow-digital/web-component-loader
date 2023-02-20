import Loader, { LoaderOptions, ElementOptions } from './loader';

interface DefinitionList {
	[name: string]: () => Promise<CustomElementConstructor> | [
		() => Promise<CustomElementConstructor>,
		ElementOptions?,
	];
}

export default function define(definitions: DefinitionList): (options?: LoaderOptions) => Loader {
	return (options) => {
		const loader = new Loader(options);

		Object.entries(definitions).forEach(([name, definition]) => {
			const [callable, options] = Array.isArray(definition) ? definition : [definition];
			loader.define(name, callable, options);
		});

		loader.run();

		return loader;
	};
}
