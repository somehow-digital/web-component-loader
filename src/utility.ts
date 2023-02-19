export function execute(defer: boolean = true) {
	return defer
		? (window.requestIdleCallback || window.requestAnimationFrame)
		: (callback: () => void) => callback();
}
