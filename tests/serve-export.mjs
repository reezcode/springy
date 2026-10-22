// Local browser-test server only. Production uses nginx.conf in the container.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { scriptSources } from '../scripts/security-headers.mjs';
const root = resolve('out');
const config = await readFile('nginx.conf', 'utf8');
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.woff2':'font/woff2' };
const headerLines = [...config.matchAll(/add_header ([\w-]+) "([^"\n]+)" always;/g)];
createServer(async(req,res)=>{
  try {
    if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const url = new URL(req.url,'http://localhost');
    let file = resolve(root,`.${decodeURIComponent(url.pathname)}`);
    if(!file.startsWith(root+sep)&&file!==root) throw new Error('path');
    if((await stat(file)).isDirectory()) file=resolve(file,'index.html');
    const data=await readFile(file);
    const sources=extname(file)==='.html'?scriptSources(data.toString()):"'self'";
    const headers={'Content-Type':types[extname(file)]??'application/octet-stream'};
    for(const line of headerLines) headers[line[1]]=line[2].replace('$springy_script_sources',sources);
    res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:data);
  }catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Export test server http://127.0.0.1:4173'));
