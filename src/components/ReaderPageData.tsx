"use client";
import {createContext,useContext,useEffect} from 'react';
import type {Chapter,CodeBlock,GlossaryTerm} from '../content/types';
export interface PageData {chapterId:string;outline:Chapter['outline'];hasChecklists:boolean;terms:GlossaryTerm[];blocks:CodeBlock[]}
export const ReaderPageContext=createContext<(data:PageData)=>void>(()=>{});
export function ReaderPageData({value}:{value:PageData}){const update=useContext(ReaderPageContext);useEffect(()=>update(value),[value,update]);return null;}
