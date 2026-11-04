const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const esbuild=require('esbuild');
process.chdir(__dirname);
const dir='dist';
const read=p=>fs.readFileSync(p,'utf8');
const scripts={THREE:'three.min.js',DATA:'data.js',ENGINE:'engine.js',UI:'ui.js',LEARNING:'learning.js',MEDIA:'media.js',MILL:'mill.js',TABLET:'tablet.js',MAIN:'main.js'};
async function build(){
  fs.mkdirSync(dir,{recursive:true});
  for(const name of ['assets','licenses'])fs.cpSync(name,path.join(dir,name),{recursive:true});
  for(const name of ['manifest.webmanifest','style.css',...Object.values(scripts)])fs.copyFileSync(name,path.join(dir,name));
  await esbuild.build({absWorkingDir:__dirname,entryPoints:['fauna.mjs'],outfile:dir+'/fauna.js',bundle:true,format:'iife',globalName:'ForestFauna',minify:true,plugins:[{
    name:'reuse-engine',setup(build){build.onResolve({filter:/^three$/},()=>({path:'three',namespace:'global'}));build.onLoad({filter:/.*/,namespace:'global'},()=>({contents:'module.exports=globalThis.THREE'}))}
  }]});
  let html=read('shell.html').replace('<style>/*STYLE*/</style>','<link rel="stylesheet" href="./style.css">');
  for(const [key,file] of Object.entries(scripts)){
    html=html.replace('<script>/*'+key+'*/</script>',(key==='MAIN'?'<script src="./fauna.js"></script>':'')+'<script src="./'+file+'"></script>');
  }
  fs.writeFileSync(dir+'/index.html',html);
  fs.writeFileSync(dir+'/.nojekyll','');
  function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(folder,e.name)):[path.join(folder,e.name)])}
  const urls=files(dir).map(p=>path.relative(dir,p).replaceAll('\\','/')).filter(x=>!['sw.js','.nojekyll'].includes(x)).sort();
  const digest=createHash('sha256');for(const url of urls){digest.update(url);digest.update(fs.readFileSync(path.join(dir,url)))}
  const sw=read('worker.js').replace('/*VERSION*/',JSON.stringify(digest.digest('hex').slice(0,14))).replace('/*FILES*/',JSON.stringify(urls));
  fs.writeFileSync(dir+'/sw.js',sw);
  console.log(urls.length+' fichiers, cache '+urls.reduce((n,x)=>n+fs.statSync(path.join(dir,x)).size,0)+' octets');
}
build().catch(e=>{console.error(e);process.exitCode=1});

