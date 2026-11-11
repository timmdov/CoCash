export type Day = {date:string; balance:number; change:number; shortfall:number};
export type Forecast = {today:string; buffer:number; days:Day[]; warnings:Day[]};
export type Transaction = {id:number; description:string; amount:number; type:'income'|'expense'; date:string};
export type Recurring = {id:number; description:string; amount:number; day:number};
export type State = {profile:{balance:number; buffer:number}; transactions:Transaction[]; recurring:Recurring[]; forecast:Forecast};
export async function request<T>(path:string, method='GET', body?:unknown):Promise<T> {
  const response = await fetch(`/api/${path}`, {method, headers:{'Content-Type':'application/json'}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  if(!response.ok){
    let message = `Request failed (${response.status}). Please try again.`;
    try { const error = await response.json(); if(Array.isArray(error.detail)) message = error.detail.map((e:{loc:string[];msg:string})=>`${e.loc.slice(1).join('.')}: ${e.msg}`).join(' · '); } catch { /* retain useful HTTP fallback */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
