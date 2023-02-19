import Loader, { Options, ElementOptions } from './loader';

interface Definitions {
	[name: string]: () => Promise<CustomElementConstructor> | [
		() => Promise<CustomElementConstructor>,
		ElementOptions?,
	];
}

export default function define(definitions: Definitions): (options?: Options) => Loader {
	return (options) => {
		const loader = new Loader(options);

		Object.entries(definitions).forEach(([name, definition]) => {
			if (Array.isArray(definition)) {
				loader.define(name, definition[0], definition[1]);
			} else {
				loader.define(name, definition);
			}
		});

		loader.run();

		return loader;
	};
}
