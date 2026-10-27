"use client";
import {createContext,useContext,useEffect} from 'react';
import type {Chapter,CodeBlock,GlossaryLevel,GlossaryTerm} from '../content/types';
export interface PageData {chapterId:string;outline:Chapter['outline'];hasChecklists:boolean;terms:GlossaryTerm[];levels:Record<GlossaryLevel,string>|null;blocks:CodeBlock[]}
export const ReaderPageContext=createContext<(data:PageData)=>void>(()=>{});
export function ReaderPageData({value}:{value:PageData}){const update=useContext(ReaderPageContext);useEffect(()=>update(value),[value,update]);return null;}
