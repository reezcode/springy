export type Order = {id:number;product:string;quantity:number};
export type ApiState = {orders:Order[]; keys:Record<string,{order:Order; fingerprint:string}>};
export function request(state:ApiState, method:string,path:string,body:string,authorized:boolean,key:string) {
  const response=(status:number,data:unknown,next=state)=>({status,data,next});
  if(!authorized) return response(401,{title:'Unauthorized',detail:'Simulasi token tidak tersedia atau tidak valid.'});
  if(method==='GET' && path==='/orders') return response(200,state.orders);
  if(method==='GET' && /^\/orders\/\d+$/.test(path)) {
    const order=state.orders.find(o=>o.id===Number(path.split('/')[2]));
    return order?response(200,order):response(404,{title:'Not Found',detail:'Order tidak ditemukan.'});
  }
  if(method==='POST' && path==='/orders') {
    let input:unknown; try{input=JSON.parse(body);}catch{return response(400,{title:'Bad Request',detail:'JSON tidak valid.'});}
    if(!input || typeof input!=='object' || !('product' in input) || typeof input.product!=='string' || !input.product.trim() || !('quantity' in input) || typeof input.quantity!=='number' || !Number.isInteger(input.quantity) || input.quantity<1) return response(400,{title:'Validation failed',detail:'product wajib diisi; quantity harus bilangan bulat minimal 1.'});
    const fingerprint=JSON.stringify({product:input.product.trim(),quantity:input.quantity});
    if(key && Object.hasOwn(state.keys,key)) {
      const old=state.keys[key];
      return old.fingerprint===fingerprint?response(200,{...old.order,replayed:true}):response(409,{title:'Conflict',detail:'Key yang sama sudah dipakai untuk payload lain.'});
    }
    const order={id:(state.orders.at(-1)?.id??0)+1,product:input.product.trim(),quantity:input.quantity};
    return response(201,order,{orders:[...state.orders,order],keys:key?{...state.keys,[key]:{order,fingerprint}}:state.keys});
  }
  return response(404,{title:'Not Found',detail:'Endpoint simulasi: GET /orders, GET /orders/{id}, POST /orders.'});
}
export type Breaker = {phase:'CLOSED'|'OPEN'|'HALF_OPEN';calls:boolean[];clock:number;openedAt:number};
export const initialBreaker:Breaker={phase:'CLOSED',calls:[],clock:0,openedAt:0};
export function breakerCall(b:Breaker,success:boolean):{next:Breaker;message:string} {
  if(b.phase==='OPEN') return {next:b,message:'Call ditolak. Dependency tidak dipanggil selama OPEN.'};
  if(b.phase==='HALF_OPEN') return success?{next:{...initialBreaker,clock:b.clock},message:'Probe berhasil. Kembali CLOSED; window direset.'}:{next:{...b,phase:'OPEN',openedAt:b.clock},message:'Probe gagal. Kembali OPEN selama 10 detik virtual.'};
  const calls=[...b.calls,success].slice(-4);
  const open=calls.length>=4 && calls.filter(x=>!x).length/calls.length>=0.5;
  return {next:{...b,calls,phase:open?'OPEN':'CLOSED',openedAt:open?b.clock:b.openedAt},message:open?'Ambang 50% tercapai setelah 4 call. Circuit OPEN.':`Call ${success?'berhasil':'gagal'}. ${calls.length}/4 sampel pada window.`};
}
export function advanceBreaker(b:Breaker):Breaker { const clock=b.clock+10; return {...b,clock,phase:b.phase==='OPEN' && clock-b.openedAt>=10?'HALF_OPEN':b.phase}; }
export function containerCommand(engine:string,image:string,port:string) {
  if(!['docker','podman'].includes(engine))return null;
  if(!/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]*$/.test(image) || !/^\d+$/.test(port) || Number(port)<1024 || Number(port)>65535)return null;
  return `${engine} run --rm --name order-lab -p 127.0.0.1:${Number(port)}:8080 ${image}`;
}
