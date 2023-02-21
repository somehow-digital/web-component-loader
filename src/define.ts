import Loader from './loader';
import { LoaderOptions, ElementDefinitionList } from './types';

export default function define(definitions: ElementDefinitionList): (options?: LoaderOptions) => Loader {
	return (options: LoaderOptions = {}): Loader => {
		const loader = new Loader({...options, init: false });

		Object.entries(definitions).forEach(([name, definition]) => {
			const [callable, options] = Array.isArray(definition) ? definition : [definition];
			loader.define(name, callable, options);
		});

		loader.run();

		return loader;
	};
}
