export const STORAGE_KEY='simagang:v3:demo';
export function emptyState(){return {schemaVersion:3,user:null,profiles:{},free:null,orders:[],entitlements:[],attempts:[],activeAttemptId:null};}
export function readState(){try {const obj=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return obj?.schemaVersion===3?obj:emptyState();}catch{return emptyState();}}
export function writeState(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data;}
export function updateState(change){const state=readState();change(state);return writeState(state);}
export const makeId=(prefix='id')=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export function downloadText(filename,content,mime='text/plain;charset=utf-8') {const file=new Blob([content],{type:mime});const link=document.createElement('a');const url=URL.createObjectURL(file);link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
