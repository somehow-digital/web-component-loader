import Loader from './loader';
import { LoaderOptions, ElementDefinitionList } from './types';

export default function define(definitions: ElementDefinitionList): (options: Omit<LoaderOptions, 'context'> = {}) => Loader {
	return (options): Loader => {
		const loader = new Loader({...options, init: false });

		Object.entries(definitions).forEach(([name, definition]) => {
			const [callable, options] = Array.isArray(definition) ? definition : [definition];
			loader.define(name, callable, options);
		});

		loader.run();

		return loader;
	};
}
