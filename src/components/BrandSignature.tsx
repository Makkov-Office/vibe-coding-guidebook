/* eslint-disable @next/next/no-img-element -- Native SVG logos need no raster image optimizer. */
import {ProjectIcon} from './ProjectIcon';

export function BrandSignature(){
 return <div className="brand-signature"><span className="brand-credit">by <img src="/brand/makkov.svg" width={124} height={15} alt="Makkov"/></span><span className="open-source-badge"><ProjectIcon name="git"/> Open Source</span></div>;
}
