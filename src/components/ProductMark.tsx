/* eslint-disable @next/next/no-img-element -- Original brand assets are served without transformation. */
import {productLogo} from '../design/product-logos.mjs';
export function ProductMark({id}:{id:string}){
 const logo=productLogo(id.replace(/^term-/,''));
 return logo?<img className={`product-mark ${logo.tone??''}`} src={logo.src} width={20} height={20} alt="" aria-hidden="true"/>:null;
}
