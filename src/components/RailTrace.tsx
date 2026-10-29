// Hover of the rail (P3-09, docs/design/visual-language.md «Навигация»): a thin drafting line traces
// the contour of the 56×32 pill around the icon. Two halves start together at the bottom centre and
// meet at the top, like a compass closing a circle. CSS draws them (stroke-dashoffset, nav-rail.css);
// without motion the contour appears at once.
const r=15.25;
export function RailTrace(){
 return <svg className="rail-trace" viewBox="0 0 56 32" aria-hidden="true" focusable="false">
  <path pathLength={1} d={`M28 31.25H16A${r} ${r} 0 0 1 16 .75H28`}/>
  <path pathLength={1} d={`M28 31.25H40A${r} ${r} 0 0 0 40 .75H28`}/>
 </svg>;
}
