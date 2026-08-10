export interface SvgNode {
	tag: string;
	attrs: Record<string, string>;
}

const n = (tag: string, attrs: Record<string, string>): SvgNode => ({ tag, attrs });

export const icons: Record<string, SvgNode[]> = {
	grid: [
		n("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
		n("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
		n("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
		n("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }),
	],
	user: [
		n("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
		n("circle", { cx: "12", cy: "7", r: "4" }),
	],
	folder: [
		n("path", {
			d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
		}),
	],
	calendar: [
		n("path", { d: "M8 2v4" }),
		n("path", { d: "M16 2v4" }),
		n("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }),
		n("path", { d: "M3 10h18" }),
	],
	building: [
		n("rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }),
		n("path", { d: "M9 22v-4h6v4" }),
		n("path", { d: "M8 6h.01" }),
		n("path", { d: "M16 6h.01" }),
		n("path", { d: "M12 6h.01" }),
		n("path", { d: "M12 10h.01" }),
		n("path", { d: "M12 14h.01" }),
		n("path", { d: "M16 10h.01" }),
		n("path", { d: "M16 14h.01" }),
		n("path", { d: "M8 10h.01" }),
		n("path", { d: "M8 14h.01" }),
	],
	search: [n("circle", { cx: "11", cy: "11", r: "8" }), n("path", { d: "m21 21-4.3-4.3" })],
	sliders: [
		n("line", { x1: "21", x2: "14", y1: "4", y2: "4" }),
		n("line", { x1: "10", x2: "3", y1: "4", y2: "4" }),
		n("line", { x1: "21", x2: "12", y1: "12", y2: "12" }),
		n("line", { x1: "8", x2: "3", y1: "12", y2: "12" }),
		n("line", { x1: "21", x2: "16", y1: "20", y2: "20" }),
		n("line", { x1: "12", x2: "3", y1: "20", y2: "20" }),
		n("line", { x1: "14", x2: "14", y1: "2", y2: "6" }),
		n("line", { x1: "8", x2: "8", y1: "10", y2: "14" }),
		n("line", { x1: "16", x2: "16", y1: "18", y2: "22" }),
	],
	sun: [
		n("circle", { cx: "12", cy: "12", r: "4" }),
		n("path", { d: "M12 2v2" }),
		n("path", { d: "M12 20v2" }),
		n("path", { d: "m4.93 4.93 1.41 1.41" }),
		n("path", { d: "m17.66 17.66 1.41 1.41" }),
		n("path", { d: "M2 12h2" }),
		n("path", { d: "M20 12h2" }),
		n("path", { d: "m6.34 17.66-1.41 1.41" }),
		n("path", { d: "m19.07 4.93-1.41 1.41" }),
	],
	moon: [n("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })],
	refresh: [
		n("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		n("path", { d: "M21 3v5h-5" }),
		n("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		n("path", { d: "M8 16H3v5" }),
	],
	chevronLeft: [n("path", { d: "m15 18-6-6 6-6" })],
	chevronRight: [n("path", { d: "m9 18 6-6-6-6" })],
	check: [n("path", { d: "M20 6 9 17l-5-5" })],
	flag: [
		n("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }),
		n("line", { x1: "4", x2: "4", y1: "22", y2: "15" }),
	],
	key: [
		n("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
		n("path", { d: "m21 2-9.6 9.6" }),
		n("path", { d: "m15.5 7.5 3 3L22 7l-3-3" }),
	],
	cookie: [
		n("path", { d: "M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" }),
		n("path", { d: "M8.5 8.5v.01" }),
		n("path", { d: "M16 15.5v.01" }),
		n("path", { d: "M12 12v.01" }),
		n("path", { d: "M11 17v.01" }),
		n("path", { d: "M7 14v.01" }),
	],
	terminal: [
		n("polyline", { points: "4 17 10 11 4 5" }),
		n("line", { x1: "12", x2: "20", y1: "19", y2: "19" }),
	],
	graduation: [
		n("path", { d: "M22 10 12 5 2 10l10 5 10-5Z" }),
		n("path", { d: "M6 12.5V17c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-4.5" }),
		n("path", { d: "M22 10v6" }),
	],
	keyboard: [
		n("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }),
		n("path", { d: "M6 8h.001" }),
		n("path", { d: "M10 8h.001" }),
		n("path", { d: "M14 8h.001" }),
		n("path", { d: "M18 8h.001" }),
		n("path", { d: "M8 12h.001" }),
		n("path", { d: "M12 12h.001" }),
		n("path", { d: "M16 12h.001" }),
		n("path", { d: "M7 16h10" }),
	],
};
