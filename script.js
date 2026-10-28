var MENU_AWAL=[
[1,"kopi","Chapter One Espresso",18000,"espresso-shot"],[2,"kopi","The Main Character",25000,"main-character"],
[3,"kopi","Cliffhanger Americano",22000,"americano"],[4,"kopi","Plot Twist Latte",24000,"latte"],
[5,"kopi","Foreshadowing Frappe",26000,"frappe"],[6,"kopi","Epilogue Espresso",23000,"epilogue-espresso"],
[7,"kopi","Mystery Mocha",20000,"mocha"],
[8,"nonkopi","Tropical Tale Tea",18000,"tropical-tea"],[9,"nonkopi","Lemon Plot",16000,"lemon-plot"],
[10,"nonkopi","Fantasy Fizz",19000,"fantasy-fizz"],[11,"nonkopi","Berry Chronicle",20000,"berry-chronicle"],
[12,"nonkopi","Mint Mystery",18000,"mint-mystery"],[13,"nonkopi","Twist Tea",17000,"twist-tea"],
[14,"nonkopi","Classic Citrus",15000,"classic-citrus"],
[15,"makanan","Narrative Nachos",20000,"nachos"],[16,"makanan","Plot Popcorn",15000,"popcorn"],
[17,"makanan","Twist Fries",18000,"twist-fries"],[18,"makanan","Character Chips",16000,"chips"],
[19,"makanan","Suspense Stick",17000,"suspense-stick"],
[20,"dessert","Sweet Epilogue",22000,"sweet-epilogue"],[21,"dessert","Drama Donut",20000,"donut"],
[22,"dessert","Cliff Cake",24000,"cliff-cake"],[23,"dessert","Mystery Muffin",21000,"muffin"],
[24,"dessert","Ending Eclair",23000,"eclair"]
];
var KAT={kopi:"☕ Menu Kopi",nonkopi:"🍹 Menu Non-Kopi",makanan:"🍟 Makanan Ringan",dessert:"🍰 Dessert"};
var EMO={kopi:"☕",nonkopi:"🍹",makanan:"🍟",dessert:"🍰"};
var BAYAR=["Cash","E-Wallet (GoPay, OVO, DANA, ShopeePay)","QRIS","Transfer Bank"];
var ST=['Menunggu','Diproses','Selesai'];

// ===== Data (sementara localStorage; nanti diganti Supabase) =====
var DB={
 get:function(k,d){try{var v=localStorage.getItem('sc3_'+k);return v?JSON.parse(v):d}catch(e){return d}},
 set:function(k,v){try{localStorage.setItem('sc3_'+k,JSON.stringify(v))}catch(e){}}
};
function sha(s){
 if(!(window.crypto&&crypto.subtle))return Promise.resolve('p:'+btoa(unescape(encodeURIComponent(s))));
 return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){
  return Array.from(new Uint8Array(b)).map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')});
}
function initData(){
 if(!DB.get('menu'))DB.set('menu',MENU_AWAL.map(function(m){return{id:m[0],kategori:m[1],nama:m[2],harga:m[3],foto:m[4],img:'',stok:50}}));
 if(!DB.get('orders'))DB.set('orders',[]);
 if(DB.get('users'))return Promise.resolve();
 return Promise.all([sha('admin123'),sha('kasir123')]).then(function(h){
  DB.set('users',[{u:'admin',h:h[0],role:'admin'},{u:'kasir',h:h[1],role:'kasir'}])});
}
var S={user:null,tab:'kasir',cart:{},cust:'',pay:BAYAR[0],edit:null,f:null,img:'',err:'',e1:'',e2:'',toast:'',receipt:DB.get('receipt','')};
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rp(n){return 'Rp'+Number(n).toLocaleString('id-ID')}
function say(t){S.toast=t;draw();setTimeout(function(){S.toast='';draw()},1800)}

// ===== Login dan sandi =====
function cekSandi(u,p){
 return sha(p).then(function(h){
  if(p.length<6)return{err:'Sandi minimal 6 karakter.'};
  if(DB.get('users',[]).some(function(x){return x.u!==u&&x.h===h}))return{err:'Sandi sudah dipakai akun lain. Pilih sandi yang berbeda.'};
  return{h:h};
 });
}
function pilihPeran(r){S.pilih=r;S.err='';draw()}
function doLogin(){
 var u=$('lu').value.trim().toLowerCase(),p=$('lp').value;
 sha(p).then(function(h){
  var f=DB.get('users',[]).filter(function(x){return x.u===u&&x.h===h})[0];
  if(!f){S.err='Username atau sandi salah.';draw();return}
  if(f.role!==S.pilih){S.err='Akun ini bukan akun '+S.pilih+'. Pilih peran yang sesuai.';draw();return}
  S.user={u:f.u,role:f.role};S.err='';S.tab=f.role==='admin'?'pesanan':'kasir';DB.set('session',S.user);draw();
 });
}
function logout(){S.user=null;S.pilih='';S.cart={};DB.set('session',null);draw()}
function loginView(){
 if(!S.pilih){
  return '<main><section style="max-width:520px;margin:2rem auto;text-align:center"><h2>Masuk sebagai</h2><p class="muted">Pilih peranmu dulu.</p>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-top:1rem">'+
  '<button class="pri" style="padding:1.6rem 1rem;font-size:1.1rem" onclick="pilihPeran(\'kasir\')">🧾<br>Kasir</button>'+
  '<button style="padding:1.6rem 1rem;font-size:1.1rem" onclick="pilihPeran(\'admin\')">🔑<br>Admin</button></div></section></main>';
 }
 return '<main><section style="max-width:420px;margin:2rem auto"><h2>Masuk sebagai '+S.pilih+'</h2>'+
 '<label for="lu">Username</label><input id="lu" autocomplete="username">'+
 '<label for="lp">Sandi</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')doLogin()">'+
 (S.err?'<div class="err">'+S.err+'</div>':'')+
 '<button class="pri" style="width:100%;margin-top:1rem" onclick="doLogin()">Masuk</button>'+
 '<button class="garis" style="width:100%" onclick="pilihPeran(\'\')">← Ganti peran</button></section></main>';
}

// ===== Kasir (khusus memesan) =====
function fotoSrc(m){return m.img||(window.FOTO&&FOTO[m.foto])||('foto-menu/'+m.foto+'.jpg')}
function kartu(m){
 return '<div class="kartu"><div class="thumb"><span>'+(EMO[m.kategori]||'☕')+'</span>'+
 '<img src="'+esc(fotoSrc(m))+'" alt="'+esc(m.nama)+'" loading="lazy" onerror="this.remove()"></div>'+
 '<div class="info"><b>'+esc(m.nama)+'</b><span class="hrg">'+rp(m.harga)+'</span><small>'+(m.stok>0?'Stok '+m.stok:'Habis')+'</small>'+
 '<button '+(m.stok<=0?'disabled':'')+' onclick="add('+m.id+')">Pilih</button></div></div>';
}
function cartLines(){
 return DB.get('menu',[]).filter(function(m){return S.cart[m.id]}).map(function(m){return{id:m.id,nama:m.nama,harga:m.harga,qty:S.cart[m.id]}});
}
function add(id){
 var m=DB.get('menu',[]).filter(function(x){return x.id===id})[0],q=(S.cart[id]||0)+1;
 if(q>m.stok){say('Stok '+m.nama+' tidak cukup');return}
 S.cart[id]=q;draw();
}
function dec(id){S.cart[id]=(S.cart[id]||0)-1;if(S.cart[id]<=0)delete S.cart[id];draw()}
function checkout(){
 var L=cartLines();if(!L.length){say('Pilih menu dulu');return}
 var name=S.cust.trim();if(!name){say('Nama pelanggan wajib diisi!');return}
 var o=DB.get('orders',[]),menu=DB.get('menu',[]),no=DB.get('nomor',1),total=0;
 var struk="====== THE STORY CAFÉ ======\nNomor Antrian: "+no+"\nNama: "+name+"\n----------------------------\n";
 L.forEach(function(l){total+=l.harga*l.qty;struk+=l.nama+" x"+l.qty+" - "+rp(l.harga*l.qty)+"\n"});
 struk+="----------------------------\nTotal: "+rp(total)+"\nMetode Bayar: "+S.pay+"\n============================";
 menu.forEach(function(m){L.forEach(function(l){if(l.id===m.id)m.stok-=l.qty})});
 o.push({id:Date.now(),no:no,customer:name,items:L,total:total,pay:S.pay,status:0,time:Date.now()});
 DB.set('menu',menu);DB.set('orders',o);DB.set('nomor',no+1);DB.set('receipt',struk);
 S.cart={};S.cust='';S.receipt=struk;say('Pesanan #'+no+' masuk ke daftar Pesanan');
}
function kasirView(){
 var menu=DB.get('menu',[]),L=cartLines(),total=L.reduce(function(a,l){return a+l.harga*l.qty},0);
 var h='<main><section class="lebar"><h2>Menu</h2>';
 Object.keys(KAT).forEach(function(k){
  var it=menu.filter(function(m){return m.kategori===k});
  if(it.length)h+='<h3>'+KAT[k]+'</h3><div class="grid">'+it.map(kartu).join('')+'</div>';
 });
 h+='</section><section><h2>Pesanan Baru</h2>';
 if(!L.length)h+='<p class="muted">Belum ada menu. Ketuk Pilih pada menu.</p>';
 L.forEach(function(l){h+='<div class="baris"><span>'+esc(l.nama)+' x'+l.qty+'</span><span><b>'+rp(l.harga*l.qty)+'</b> <button class="garis kecil" aria-label="Kurangi '+esc(l.nama)+'" onclick="dec('+l.id+')">−</button></span></div>'});
 h+='<p>Total: <span class="total">'+rp(total)+'</span></p>'+
 '<label for="cust">Nama pelanggan</label><input id="cust" value="'+esc(S.cust)+'" oninput="S.cust=this.value" placeholder="Contoh: Rina">'+
 '<label for="pay">Metode pembayaran</label><select id="pay" onchange="S.pay=this.value">'+BAYAR.map(function(p){return '<option'+(S.pay===p?' selected':'')+'>'+p+'</option>'}).join('')+'</select>'+
 '<button class="pri" onclick="checkout()">🧾 Checkout</button> <button class="garis" onclick="S.cart={};draw()">♻️ Reset</button>';
 if(S.receipt)h+='<div id="receiptSection">'+esc(S.receipt)+'</div>';
 return h+'</section></main>';
}

// ===== Pesanan masuk dan diproses =====
function nextStatus(id){var o=DB.get('orders',[]);o.forEach(function(x){if(x.id===id&&x.status<2)x.status++});DB.set('orders',o);draw()}
function aktif(){return DB.get('orders',[]).filter(function(x){return x.status<2}).length}
function pesananView(){
 var o=DB.get('orders',[]).slice().reverse();
 var act=o.filter(function(x){return x.status<2}).reverse(),done=o.filter(function(x){return x.status===2}).slice(0,6);
 function card(x){
  return '<div class="pcard"><div class="baris" style="border:0"><b>#'+x.no+' '+esc(x.customer)+'</b><span class="badge s'+x.status+'">'+ST[x.status]+'</span></div>'+
  '<div class="muted">'+x.items.map(function(i){return esc(i.nama)+' x'+i.qty}).join(', ')+'</div>'+
  '<div class="baris" style="border:0"><span>'+rp(x.total)+' · '+esc(x.pay)+'</span>'+(x.status<2?'<button class="pri kecil" onclick="nextStatus('+x.id+')">'+(x.status===0?'Mulai proses':'Tandai selesai')+'</button>':'')+'</div></div>';
 }
 var h='<main><section class="lebar"><h2>Pesanan Masuk</h2><p class="muted">'+act.length+' pesanan menunggu atau sedang diproses.</p>'+
 (act.length?act.map(card).join(''):'<p class="muted">Belum ada pesanan masuk.</p>');
 if(done.length)h+='<h3>Baru selesai</h3>'+done.map(card).join('');
 return h+'</section></main>';
}

// ===== Kelola menu (admin) =====
function readForm(){S.f={nama:$('mn').value,kategori:$('mk').value,harga:$('mp').value,stok:$('ms').value}}
function pickFoto(inp){
 var f=inp.files[0];if(!f)return;readForm();
 var r=new FileReader();
 r.onload=function(){var im=new Image();im.onload=function(){
  var w=Math.min(600,im.width),h=Math.round(im.height*w/im.width),c=document.createElement('canvas');
  c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);S.img=c.toDataURL('image/jpeg',0.7);draw()};im.src=r.result};
 r.readAsDataURL(f);
}
function editMenu(id){S.edit=id;S.f=null;S.img='';S.err='';draw();window.scrollTo(0,0)}
function batalMenu(){S.edit=null;S.f=null;S.img='';S.err='';draw()}
function saveMenu(){
 var n=$('mn').value.trim(),k=$('mk').value,p=parseInt($('mp').value,10),s=parseInt($('ms').value,10);
 if(!n||isNaN(p)||p<0||isNaN(s)||s<0){readForm();S.err='Isi nama, harga, dan stok dengan angka yang benar.';draw();return}
 var m=DB.get('menu',[]);
 if(S.edit){m.forEach(function(x){if(x.id===S.edit){x.nama=n;x.kategori=k;x.harga=p;x.stok=s;if(S.img)x.img=S.img}})}
 else m.push({id:Date.now(),kategori:k,nama:n,harga:p,stok:s,foto:'',img:S.img});
 DB.set('menu',m);S.edit=null;S.f=null;S.img='';S.err='';say('Menu tersimpan');
}
function delMenu(id){if(!confirm('Hapus menu ini?'))return;DB.set('menu',DB.get('menu',[]).filter(function(x){return x.id!==id}));delete S.cart[id];draw()}
function menuView(){
 var m=DB.get('menu',[]),cur=m.filter(function(x){return x.id===S.edit})[0];
 var e=S.f||(cur?{nama:cur.nama,kategori:cur.kategori,harga:cur.harga,stok:cur.stok}:{nama:'',kategori:'kopi',harga:'',stok:50});
 var prev=S.img||(cur?fotoSrc(cur):'');
 var h='<main><section class="lebar"><h2>Kelola Menu</h2><h3>'+(S.edit?'Ubah menu':'Tambah menu')+'</h3>'+
 '<label for="mn">Nama menu</label><input id="mn" value="'+esc(e.nama)+'">'+
 '<label for="mk">Kategori</label><select id="mk">'+Object.keys(KAT).map(function(k){return '<option value="'+k+'"'+(e.kategori===k?' selected':'')+'>'+KAT[k]+'</option>'}).join('')+'</select>'+
 '<label for="mp">Harga (Rp)</label><input id="mp" type="number" inputmode="numeric" value="'+esc(e.harga)+'">'+
 '<label for="ms">Stok</label><input id="ms" type="number" inputmode="numeric" value="'+esc(e.stok)+'">'+
 '<label for="mf">Foto menu</label><input id="mf" type="file" accept="image/*" onchange="pickFoto(this)">'+
 (prev?'<img class="prev" src="'+esc(prev)+'" alt="Pratinjau foto" onerror="this.remove()">':'')+
 (S.err?'<div class="err">'+S.err+'</div>':'')+
 '<p><button class="pri" onclick="saveMenu()">'+(S.edit?'Simpan perubahan':'Tambah menu')+'</button> '+(S.edit?'<button class="garis" onclick="batalMenu()">Batal</button>':'')+'</p><h3>Daftar menu ('+m.length+')</h3>';
 m.forEach(function(x){h+='<div class="baris"><span style="display:flex;gap:.6rem;align-items:center"><img class="mini" src="'+esc(fotoSrc(x))+'" alt="" onerror="this.style.visibility=\'hidden\'"><span><b>'+esc(x.nama)+'</b><br><small class="muted">'+(KAT[x.kategori]||x.kategori)+' · '+rp(x.harga)+' · stok '+x.stok+'</small></span></span><span><button class="garis kecil" onclick="editMenu('+x.id+')">Ubah</button> <button class="bahaya kecil" onclick="delMenu('+x.id+')">Hapus</button></span></div>'});
 return h+'</section></main>';
}

// ===== Laporan (admin) =====
function dayKey(t){var d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function sample(){
 var o=DB.get('orders',[]),menu=DB.get('menu',[]);
 for(var d=6;d>=1;d--)for(var k=0;k<2+Math.floor(Math.random()*4);k++){
  var items=[],n=1+Math.floor(Math.random()*3),total=0;
  for(var j=0;j<n;j++){var m=menu[Math.floor(Math.random()*menu.length)],q=1+Math.floor(Math.random()*2);items.push({id:m.id,nama:m.nama,harga:m.harga,qty:q});total+=m.harga*q}
  o.push({id:Date.now()+d*100+k,no:o.length+1,customer:'Contoh',items:items,total:total,pay:BAYAR[Math.floor(Math.random()*BAYAR.length)],status:2,time:Date.now()-d*86400000+k*3600000});
 }
 DB.set('orders',o);say('Data contoh 6 hari ditambahkan');
}
function resetAll(){
 if(!confirm('Hapus semua pesanan dan foto unggahan, lalu kembalikan menu awal? (Akun tidak dihapus)'))return;
 ['orders','menu','nomor','receipt'].forEach(function(k){localStorage.removeItem('sc3_'+k)});
 S.receipt='';initData().then(draw);
}
function laporanView(){
 var o=DB.get('orders',[]),today=dayKey(Date.now());
 var td=o.filter(function(x){return dayKey(x.time)===today});
 var sum=function(a){return a.reduce(function(s,x){return s+x.total},0)};
 var jml=td.reduce(function(s,x){return s+x.items.reduce(function(a,i){return a+i.qty},0)},0);
 var h='<main><section class="lebar"><h2>Laporan Penjualan</h2><div class="stats">'+
 '<div class="stat">Pendapatan hari ini<b>'+rp(sum(td))+'</b></div><div class="stat">Pesanan hari ini<b>'+td.length+'</b></div><div class="stat">Item terjual<b>'+jml+'</b></div></div>';
 var days=[];for(var d=6;d>=0;d--){var t=Date.now()-d*86400000,k=dayKey(t);days.push({l:new Date(t).toLocaleDateString('id-ID',{weekday:'short'}),v:sum(o.filter(function(x){return dayKey(x.time)===k}))})}
 var mx=Math.max.apply(null,days.map(function(x){return x.v}).concat([1]));
 h+='<h3>7 hari terakhir</h3><div class="bars">'+days.map(function(x){return '<div title="'+rp(x.v)+'"><i style="height:'+Math.round(x.v/mx*100)+'%"></i>'+x.l+'</div>'}).join('')+'</div>';
 var cnt={};o.forEach(function(x){x.items.forEach(function(i){cnt[i.nama]=(cnt[i.nama]||0)+i.qty})});
 var top=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]}).slice(0,5);
 h+='<h3>Menu terlaris</h3>'+(top.length?top.map(function(n){return '<div class="baris"><span>'+esc(n)+'</span><b>'+cnt[n]+' terjual</b></div>'}).join(''):'<p class="muted">Belum ada penjualan.</p>');
 var pc={};o.forEach(function(x){pc[x.pay]=(pc[x.pay]||0)+x.total});
 h+='<h3>Per metode pembayaran</h3>'+(Object.keys(pc).length?Object.keys(pc).map(function(k){return '<div class="baris"><span>'+esc(k)+'</span><b>'+rp(pc[k])+'</b></div>'}).join(''):'<p class="muted">Belum ada transaksi.</p>');
 h+='<p><button class="garis" onclick="sample()">Isi data contoh</button> <button class="bahaya" onclick="resetAll()">Reset data pesanan</button></p></section></main>';
 return h;
}

// ===== Akun =====
function gantiSandiku(){
 var o=$('po').value,n=$('pn').value,c=$('pc').value,me=S.user.u;
 sha(o).then(function(ho){
  var u=DB.get('users',[]).filter(function(x){return x.u===me})[0];
  if(!u||u.h!==ho){S.e1='Sandi lama salah.';draw();return}
  if(n!==c){S.e1='Konfirmasi sandi tidak sama.';draw();return}
  cekSandi(me,n).then(function(r){
   if(r.err){S.e1=r.err;draw();return}
   var us=DB.get('users',[]);us.forEach(function(x){if(x.u===me)x.h=r.h});DB.set('users',us);S.e1='';say('Sandi berhasil diganti');
  });
 });
}
function tambahAkun(){
 var u=$('au').value.trim().toLowerCase(),p=$('ap').value,r=$('ar').value;
 if(!/^[a-z0-9_]{3,20}$/.test(u)){S.e2='Username 3-20 karakter: huruf kecil, angka, atau _.';draw();return}
 if(DB.get('users',[]).some(function(x){return x.u===u})){S.e2='Username sudah dipakai.';draw();return}
 cekSandi(u,p).then(function(c){
  if(c.err){S.e2=c.err;draw();return}
  var us=DB.get('users',[]);us.push({u:u,h:c.h,role:r});DB.set('users',us);S.e2='';say('Akun '+u+' dibuat');
 });
}
function resetSandi(u){
 var p=prompt('Sandi baru untuk '+u+' (minimal 6 karakter):');if(p===null)return;
 cekSandi(u,p).then(function(c){
  if(c.err){S.e2=c.err;draw();return}
  var us=DB.get('users',[]);us.forEach(function(x){if(x.u===u)x.h=c.h});DB.set('users',us);S.e2='';say('Sandi '+u+' diganti');
 });
}
function hapusAkun(u){
 if(u===S.user.u){S.e2='Akun yang sedang dipakai tidak bisa dihapus.';draw();return}
 if(!confirm('Hapus akun '+u+'?'))return;
 DB.set('users',DB.get('users',[]).filter(function(x){return x.u!==u}));S.e2='';draw();
}
function akunView(){
 var h='<main><section><h2>Ganti Sandi Saya</h2><p class="muted">Akun: '+esc(S.user.u)+'</p>'+
 '<label for="po">Sandi lama</label><input id="po" type="password" autocomplete="current-password">'+
 '<label for="pn">Sandi baru</label><input id="pn" type="password" autocomplete="new-password">'+
 '<label for="pc">Ulangi sandi baru</label><input id="pc" type="password" autocomplete="new-password">'+
 (S.e1?'<div class="err">'+S.e1+'</div>':'')+'<button class="pri" onclick="gantiSandiku()">Simpan sandi</button></section>';
 if(S.user.role==='admin'){
  h+='<section class="lebar"><h2>Kelola Akun</h2>';
  DB.get('users',[]).forEach(function(x){h+='<div class="baris"><span><b>'+esc(x.u)+'</b> <small class="muted">('+x.role+')</small></span><span><button class="garis kecil" onclick="resetSandi(\''+x.u+'\')">Reset sandi</button> <button class="bahaya kecil" onclick="hapusAkun(\''+x.u+'\')">Hapus</button></span></div>'});
  h+='<h3>Tambah akun</h3><label for="au">Username</label><input id="au" autocomplete="off">'+
  '<label for="ap">Sandi (minimal 6 karakter, beda dari akun lain)</label><input id="ap" type="password" autocomplete="new-password">'+
  '<label for="ar">Peran</label><select id="ar"><option value="kasir">kasir</option><option value="admin">admin</option></select>'+
  (S.e2?'<div class="err">'+S.e2+'</div>':'')+'<button class="pri" onclick="tambahAkun()">Tambah akun</button></section>';
 }
 return h+'</main>';
}

// ===== Kerangka =====
function setTab(t){S.tab=t;S.err='';S.e1='';S.e2='';S.edit=null;S.f=null;S.img='';draw()}
function draw(){
 var app=$('app');
 if(S.user&&!DB.get('users',[]).some(function(x){return x.u===S.user.u}))S.user=null;
 if(!S.user){app.innerHTML=loginView();return}
 var admin=S.user.role==='admin',n=aktif(),lbl='Pesanan'+(n?' ('+n+')':'');
 var tabs=admin?[['pesanan',lbl],['menu','Kelola Menu'],['laporan','Laporan'],['akun','Akun']]:[['kasir','Pesan'],['pesanan',lbl]];
 if(!tabs.some(function(t){return t[0]===S.tab}))S.tab=tabs[0][0];
 var v=S.tab==='kasir'?kasirView():S.tab==='pesanan'?pesananView():S.tab==='menu'?menuView():S.tab==='laporan'?laporanView():akunView();
 app.innerHTML='<div class="nav">'+tabs.map(function(t){return '<button class="'+(S.tab===t[0]?'on':'')+'" onclick="setTab(\''+t[0]+'\')">'+t[1]+'</button>'}).join('')+
 '<button class="garis kecil" onclick="logout()">Keluar</button></div>'+v+
 (S.toast?'<div class="toast" role="status">'+esc(S.toast)+'</div>':'');
}
initData().then(draw);