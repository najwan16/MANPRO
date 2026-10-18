// Dependency-free static demo server. Run: npm run demo (no npm install needed).
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.md':'text/markdown'};
const server=http.createServer(async (req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/src/tailwindcss') {res.writeHead(200,{'Content-Type':'text/css'});res.end('/* Vite compiles Tailwind CSS; static demo uses custom stylesheet. */');return;}
    const loc=path.resolve(root,'.'+pathname);
    if(loc!==root&&!loc.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    let file=loc;
    try{const s=await stat(file);if(s.isDirectory())file=path.join(file,'index.html');}catch{file=path.join(root,'index.html');}
    const ext=path.extname(file).toLowerCase();const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':`${types[ext]||'application/octet-stream'}; charset=utf-8`,'Cache-Control':'no-cache'});res.end(bytes);
  }catch(err){res.writeHead(500);res.end('Static demo server error: '+err.message);}
});
server.listen(port,'127.0.0.1',()=>console.log(`\nSiMagang DEMO: http://localhost:${port}/#/home\nStop with Ctrl+C.\n`));
