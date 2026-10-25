export type IconName = 'filter' | 'gallery' | 'settings' | 'download' | 'archive' | 'chevron' | 'check' | 'copy' | 'close' | 'arrow-left'
	| 'list-indent-decrease' | 'list-indent-increase';

type IconDefinition = {
	viewBox: string;
	filled: boolean;
	shapes: Array<{ tag: 'path' | 'circle'; attributes: Record<string, string> }>;
};

const icons: Record<IconName, IconDefinition> = {
	'list-indent-decrease': {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M21 5H11' } },
			{ tag: 'path', attributes: { d: 'M21 12H11' } },
			{ tag: 'path', attributes: { d: 'M21 19H11' } },
			{ tag: 'path', attributes: { d: 'm7 8-4 4 4 4' } },
		]
	},
	'list-indent-increase': {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M21 5H11' } },
			{ tag: 'path', attributes: { d: 'M21 12H11' } },
			{ tag: 'path', attributes: { d: 'M21 19H11' } },
			{ tag: 'path', attributes: { d: 'm3 8 4 4-4 4' } },
		]
	},
	close: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M18 6 6 18' } },
			{ tag: 'path', attributes: { d: 'm6 6 12 12' } },
		]
	},
	'arrow-left': {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M6 8L2 12L6 16' } },
			{ tag: 'path', attributes: { d: 'M2 12H22' } },
		]
	},
	copy: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M9 9h12v12H9zM15 9V3H3v12h6' } },
		]
	},
	check: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'm5 12 4 4L19 6' } },
		]
	},
	chevron: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'm6 9 6 6 6-6' } },
		]
	},
	archive: {
		viewBox: '0 0 1920 1920',
		filled: true,
		shapes: [
			{ tag: 'path', attributes: { d: 'M533.333 560v160H240l.008 453.33 209.066 213.34H1470.93l209.06-213.34L1680 720h-293.33V560h352c55.96 0 101.33 45.368 101.33 101.333v511.997h16c35.35 0 64 28.66 64 64V1856c0 35.35-28.65 64-64 64H64c-35.346 0-64-28.65-64-64v-618.67c0-35.34 28.654-64 64-64h16V661.333C80 605.368 125.369 560 181.333 560h352ZM1040 0v958.86l183.43-183.429 113.14 113.138L960 1265.14 583.431 888.569l113.138-113.138L880 958.86V0h160Z' } },
		]
	},
	download: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M12 17V3' } },
			{ tag: 'path', attributes: { d: 'm6 11 6 6 6-6' } },
			{ tag: 'path', attributes: { d: 'M19 21H5' } },
		]
	},
	filter: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z' } },
		]
	},
	gallery: {
		viewBox: '0 0 24 24',
		filled: false,
		shapes: [
			{ tag: 'path', attributes: { d: 'M3 7V5a2 2 0 0 1 2-2h2' } },
			{ tag: 'path', attributes: { d: 'M17 3h2a2 2 0 0 1 2 2v2' } },
			{ tag: 'path', attributes: { d: 'M21 17v2a2 2 0 0 1-2 2h-2' } },
			{ tag: 'path', attributes: { d: 'M7 21H5a2 2 0 0 1-2-2v-2' } },
			{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '1' } },
			{ tag: 'path', attributes: { d: 'M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0' } },
		]
	},
	settings: {
		viewBox: '-1 0 19 19',
		filled: true,
		shapes: [
			{ tag: 'path', attributes: { d: 'M16.014 8.86v1.44a.587.587 0 0 1-.468.556l-1.182.204a.463.463 0 0 1-.114.006 5.902 5.902 0 0 1-.634 1.528.455.455 0 0 1 .078.084l.691.98a.586.586 0 0 1-.062.725l-1.02 1.02a.586.586 0 0 1-.724.061l-.98-.69a.444.444 0 0 1-.085-.078 5.908 5.908 0 0 1-1.544.637.502.502 0 0 1 0 .175l-.182 1.053a.667.667 0 0 1-.633.532h-1.31a.667.667 0 0 1-.633-.532l-.182-1.053a.495.495 0 0 1 0-.175 5.908 5.908 0 0 1-1.544-.637.444.444 0 0 1-.085.077l-.98.691a.586.586 0 0 1-.725-.062l-1.02-1.02a.586.586 0 0 1-.061-.723l.691-.98a.454.454 0 0 1 .077-.085 5.901 5.901 0 0 1-.633-1.528.466.466 0 0 1-.114-.006l-1.182-.204a.586.586 0 0 1-.468-.556V8.86a.586.586 0 0 1 .468-.556L2.636 8.1a.437.437 0 0 1 .114-.005 5.912 5.912 0 0 1 .633-1.528.466.466 0 0 1-.077-.085l-.691-.98a.587.587 0 0 1 .061-.724l1.02-1.02a.587.587 0 0 1 .725-.062l.98.691a.444.444 0 0 1 .085.078 5.903 5.903 0 0 1 1.528-.634.433.433 0 0 1 .005-.114l.204-1.182a.586.586 0 0 1 .556-.468h1.442a.586.586 0 0 1 .556.468l.204 1.182a.448.448 0 0 1 .005.114 5.908 5.908 0 0 1 1.528.634.444.444 0 0 1 .085-.078l.98-.691a.586.586 0 0 1 .724.062l1.02 1.02a.586.586 0 0 1 .062.724l-.691.98a.467.467 0 0 1-.078.085 5.902 5.902 0 0 1 .634 1.528.434.434 0 0 1 .114.005l1.182.204a.587.587 0 0 1 .468.556zm-4.955.72a2.559 2.559 0 1 0-2.56 2.56 2.559 2.559 0 0 0 2.56-2.56z' } },
		]
	},
};

export const createIcon = (name: IconName): SVGSVGElement =>
{
	const namespace = 'http://www.w3.org/2000/svg';
	const definition = icons[name];
	const svg = document.createElementNS(namespace, 'svg');
	svg.setAttribute('viewBox', definition.viewBox);
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('focusable', 'false');
	svg.setAttribute('fill', definition.filled ? 'currentColor' : 'none');
	if(!definition.filled)
	{
		svg.setAttribute('stroke', 'currentColor');
		svg.setAttribute('stroke-width', '2');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
	}
	definition.shapes.forEach((shape) =>
	{
		const element = document.createElementNS(namespace, shape.tag);
		Object.entries(shape.attributes).forEach(([key, value]) => element.setAttribute(key, value));
		svg.append(element);
	});
	return svg;
};
