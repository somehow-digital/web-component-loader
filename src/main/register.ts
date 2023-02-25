import Loader from './loader.js';
import { LoaderOptions, ElementDefinitionList } from '../types.js';

export default function register(definitions: ElementDefinitionList): (options: LoaderOptions) => Loader {
	return (options = {}): Loader => {
		const loader = new Loader({...options, init: false });

		Object.entries(definitions).forEach(([name, definition]) => {
			const [callable, options] = Array.isArray(definition) ? definition : [definition];
			loader.register(name, callable, options);
		});

		loader.run();

		return loader;
	};
}
