// ===== Koneksi Supabase =====
var SB_URL='https://vwiqutekrjtcbtgvxfac.supabase.co';
var SB_KEY='sb_publishable_JANAEjhhkMPqK-uRnV33Nw_DX1WHb9l';
var sb=supabase.createClient(SB_URL,SB_KEY);

var KAT={kopi:"☕ Menu Kopi",nonkopi:"🍹 Menu Non-Kopi",makanan:"🍟 Makanan Ringan",dessert:"🍰 Dessert"};
var EMO={kopi:"☕",nonkopi:"🍹",makanan:"🍟",dessert:"🍰"};
var BAYAR=["Cash","E-Wallet (GoPay, OVO, DANA, ShopeePay)","QRIS","Transfer Bank"];
var ST=['Menunggu','Diproses','Selesai'];

var D={menu:[],orders:[],profiles:[]};
var S={user:null,pilih:'',tab:'kasir',cart:{},cust:'',pay:BAYAR[0],edit:null,f:null,blob:null,prev:'',err:'',e1:'',toast:'',receipt:'',loading:false,fatal:'',busy:false};
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rp(n){return 'Rp'+Number(n).toLocaleString('id-ID')}
function say(t){S.toast=t;draw();setTimeout(function(){S.toast='';draw()},2200)}
function pesanError(e){return (e&&e.message)?e.message:String(e)}

// ===== Ambil data dari database =====
function loadMenu(){return sb.from('menu').select('*').order('id').then(function(r){if(r.error)throw r.error;D.menu=r.data||[]})}
function loadOrders(){return sb.from('orders').select('*').order('created_at',{ascending:false}).limit(500).then(function(r){if(r.error)throw r.error;D.orders=r.data||[]})}
function loadProfiles(){return sb.from('profiles').select('*').order('username').then(function(r){if(r.error)throw r.error;D.profiles=r.data||[]})}
function loadAll(){
 S.loading=true;S.fatal='';draw();
 var jobs=[loadMenu(),loadOrders()];
 if(S.user&&S.user.role==='admin')jobs.push(loadProfiles());
 return Promise.all(jobs).then(function(){S.loading=false;draw()}).catch(function(e){S.loading=false;S.fatal='Gagal memuat data: '+pesanError(e);draw()});
}

// ===== Login =====
function pilihPeran(r){S.pilih=r;S.err='';draw()}
function doLogin(){
 var u=$('lu').value.trim().toLowerCase(),p=$('lp').value;
 if(!u||!p){S.err='Isi username dan sandi.';draw();return}
 sb.auth.signInWithPassword({email:u+'@storycafe.app',password:p}).then(function(r){
  if(r.error){S.err='Username atau sandi salah.';draw();return}
  var uid=r.data.user.id;
  return sb.from('profiles').select('username,role').eq('id',uid).single().then(function(q){
   if(q.error||!q.data){return sb.auth.signOut().then(function(){S.err='Akun ini belum punya peran. Hubungi admin.';draw()})}
   if(q.data.role!==S.pilih){return sb.auth.signOut().then(function(){S.err='Akun ini bukan akun '+S.pilih+'. Pilih peran yang sesuai.';draw()})}
   S.user={id:uid,u:q.data.username,role:q.data.role};S.err='';
   S.tab=S.user.role==='admin'?'pesanan':'kasir';
   return loadAll();
  });
 }).catch(function(e){S.err='Tidak bisa terhubung: '+pesanError(e);draw()});
}
function logout(){
 sb.auth.signOut().then(function(){S.user=null;S.pilih='';S.cart={};S.receipt='';D.menu=[];D.orders=[];D.profiles=[];draw()});
}
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
 (S.err?'<div class="err">'+esc(S.err)+'</div>':'')+
 '<button class="pri" style="width:100%;margin-top:1rem" onclick="doLogin()">Masuk</button>'+
 '<button class="garis" style="width:100%" onclick="pilihPeran(\'\')">← Ganti peran</button></section></main>';
}

// ===== Kasir (khusus memesan) =====
function fotoSrc(m){return m.img_url||(m.foto&&window.FOTO&&FOTO[m.foto])||(m.foto?'foto-menu/'+m.foto+'.jpg':'')}
function kartu(m){
 var src=fotoSrc(m);
 return '<div class="kartu"><div class="thumb"><span>'+(EMO[m.kategori]||'☕')+'</span>'+
 (src?'<img src="'+esc(src)+'" alt="'+esc(m.nama)+'" loading="lazy" onerror="this.remove()">':'')+'</div>'+
 '<div class="info"><b>'+esc(m.nama)+'</b><span class="hrg">'+rp(m.harga)+'</span><small>'+(m.stok>0?'Stok '+m.stok:'Habis')+'</small>'+
 '<button '+(m.stok<=0?'disabled':'')+' onclick="add('+m.id+')">Pilih</button></div></div>';
}
function cartLines(){
 return D.menu.filter(function(m){return S.cart[m.id]}).map(function(m){return{id:m.id,nama:m.nama,harga:m.harga,qty:S.cart[m.id]}});
}
function add(id){
 var m=D.menu.filter(function(x){return x.id===id})[0],q=(S.cart[id]||0)+1;
 if(!m)return;
 if(q>m.stok){say('Stok '+m.nama+' tidak cukup');return}
 S.cart[id]=q;draw();
}
function dec(id){S.cart[id]=(S.cart[id]||0)-1;if(S.cart[id]<=0)delete S.cart[id];draw()}
function strukTeks(o){
 var s="====== THE STORY CAFÉ ======\nNomor Antrian: "+o.id+"\nNama: "+o.customer+"\n----------------------------\n";
 (o.items||[]).forEach(function(l){s+=l.nama+" x"+l.qty+" - "+rp(l.harga*l.qty)+"\n"});
 return s+"----------------------------\nTotal: "+rp(o.total)+"\nMetode Bayar: "+o.pay+"\n============================";
}
function checkout(){
 var L=cartLines();if(!L.length){say('Pilih menu dulu');return}
 var name=S.cust.trim();if(!name){say('Nama pelanggan wajib diisi!');return}
 if(S.busy)return;S.busy=true;
 sb.rpc('buat_pesanan',{p_customer:name,p_pay:S.pay,p_items:L.map(function(l){return{id:l.id,qty:l.qty}})}).then(function(r){
  S.busy=false;
  if(r.error){say(r.error.message);return}
  var o=r.data;S.receipt=strukTeks(o);S.cart={};S.cust='';
  return Promise.all([loadMenu(),loadOrders()]).then(function(){say('Pesanan #'+o.id+' masuk ke daftar Pesanan')});
 }).catch(function(e){S.busy=false;say('Gagal: '+pesanError(e))});
}
function kasirView(){
 var L=cartLines(),total=L.reduce(function(a,l){return a+l.harga*l.qty},0);
 var h='<main><section class="lebar"><h2>Menu</h2>';
 Object.keys(KAT).forEach(function(k){
  var it=D.menu.filter(function(m){return m.kategori===k});
  if(it.length)h+='<h3>'+KAT[k]+'</h3><div class="grid">'+it.map(kartu).join('')+'</div>';
 });
 h+='</section><section><h2>Pesanan Baru</h2>';
 if(!L.length)h+='<p class="muted">Belum ada menu. Ketuk Pilih pada menu.</p>';
 L.forEach(function(l){h+='<div class="baris"><span>'+esc(l.nama)+' x'+l.qty+'</span><span><b>'+rp(l.harga*l.qty)+'</b> <button class="garis kecil" aria-label="Kurangi '+esc(l.nama)+'" onclick="dec('+l.id+')">−</button></span></div>'});
 h+='<p>Total: <span class="total">'+rp(total)+'</span></p>'+
 '<label for="cust">Nama pelanggan</label><input id="cust" value="'+esc(S.cust)+'" oninput="S.cust=this.value" placeholder="Contoh: Rina">'+
 '<label for="pay">Metode pembayaran</label><select id="pay" onchange="S.pay=this.value">'+BAYAR.map(function(p){return '<option'+(S.pay===p?' selected':'')+'>'+esc(p)+'</option>'}).join('')+'</select>'+
 '<button class="pri" onclick="checkout()">🧾 Checkout</button> <button class="garis" onclick="S.cart={};draw()">♻️ Reset</button>';
 if(S.receipt)h+='<div id="receiptSection">'+esc(S.receipt)+'</div>';
 return h+'</section></main>';
}

// ===== Pesanan masuk dan diproses =====
function nextStatus(id){
 var o=D.orders.filter(function(x){return x.id===id})[0];if(!o||o.status>=2)return;
 sb.from('orders').update({status:o.status+1}).eq('id',id).then(function(r){
  if(r.error){say('Gagal: '+r.error.message);return}
  return loadOrders().then(draw);
 });
}
function aktif(){return D.orders.filter(function(x){return x.status<2}).length}
function pesananView(){
 var act=D.orders.filter(function(x){return x.status<2}).reverse(),done=D.orders.filter(function(x){return x.status===2}).slice(0,6);
 function card(x){
  return '<div class="pcard"><div class="baris" style="border:0"><b>#'+x.id+' '+esc(x.customer)+'</b><span class="badge s'+x.status+'">'+ST[x.status]+'</span></div>'+
  '<div class="muted">'+(x.items||[]).map(function(i){return esc(i.nama)+' x'+i.qty}).join(', ')+'</div>'+
  '<div class="baris" style="border:0"><span>'+rp(x.total)+' · '+esc(x.pay)+'</span>'+(x.status<2?'<button class="pri kecil" onclick="nextStatus('+x.id+')">'+(x.status===0?'Mulai proses':'Tandai selesai')+'</button>':'')+'</div></div>';
 }
 var h='<main><section class="lebar"><h2>Pesanan Masuk</h2><p class="muted">'+act.length+' pesanan menunggu atau sedang diproses. Daftar diperbarui otomatis.</p>'+
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
  var w=Math.min(800,im.width),h=Math.round(im.height*w/im.width),c=document.createElement('canvas');
  c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);
  c.toBlob(function(b){S.blob=b;S.prev=URL.createObjectURL(b);draw()},'image/jpeg',0.8)};im.src=r.result};
 r.readAsDataURL(f);
}
function editMenu(id){S.edit=id;S.f=null;S.blob=null;S.prev='';S.err='';draw();window.scrollTo(0,0)}
function batalMenu(){S.edit=null;S.f=null;S.blob=null;S.prev='';S.err='';draw()}
function saveMenu(){
 var n=$('mn').value.trim(),k=$('mk').value,p=parseInt($('mp').value,10),s=parseInt($('ms').value,10);
 if(!n||isNaN(p)||p<0||isNaN(s)||s<0){readForm();S.err='Isi nama, harga, dan stok dengan angka yang benar.';draw();return}
 var up=Promise.resolve(null);
 if(S.blob){
  var path=Date.now()+'.jpg';
  up=sb.storage.from('foto-menu').upload(path,S.blob,{contentType:'image/jpeg'}).then(function(r){
   if(r.error)throw r.error;
   return sb.storage.from('foto-menu').getPublicUrl(path).data.publicUrl;
  });
 }
 up.then(function(url){
  var row={nama:n,kategori:k,harga:p,stok:s};if(url)row.img_url=url;
  return S.edit?sb.from('menu').update(row).eq('id',S.edit):sb.from('menu').insert(row);
 }).then(function(r){
  if(r.error)throw r.error;
  S.edit=null;S.f=null;S.blob=null;S.prev='';S.err='';
  return loadMenu().then(function(){say('Menu tersimpan')});
 }).catch(function(e){S.err='Gagal menyimpan: '+pesanError(e);draw()});
}
function delMenu(id){
 if(!confirm('Hapus menu ini?'))return;
 sb.from('menu').delete().eq('id',id).then(function(r){
  if(r.error){say('Gagal: '+r.error.message);return}
  delete S.cart[id];return loadMenu().then(draw);
 });
}
function menuView(){
 var cur=D.menu.filter(function(x){return x.id===S.edit})[0];
 var e=S.f||(cur?{nama:cur.nama,kategori:cur.kategori,harga:cur.harga,stok:cur.stok}:{nama:'',kategori:'kopi',harga:'',stok:50});
 var prev=S.prev||(cur?fotoSrc(cur):'');
 var h='<main><section class="lebar"><h2>Kelola Menu</h2><h3>'+(S.edit?'Ubah menu':'Tambah menu')+'</h3>'+
 '<label for="mn">Nama menu</label><input id="mn" value="'+esc(e.nama)+'">'+
 '<label for="mk">Kategori</label><select id="mk">'+Object.keys(KAT).map(function(k){return '<option value="'+k+'"'+(e.kategori===k?' selected':'')+'>'+KAT[k]+'</option>'}).join('')+'</select>'+
 '<label for="mp">Harga (Rp)</label><input id="mp" type="number" inputmode="numeric" value="'+esc(e.harga)+'">'+
 '<label for="ms">Stok</label><input id="ms" type="number" inputmode="numeric" value="'+esc(e.stok)+'">'+
 '<label for="mf">Foto menu</label><input id="mf" type="file" accept="image/*" onchange="pickFoto(this)">'+
 (prev?'<img class="prev" src="'+esc(prev)+'" alt="Pratinjau foto" onerror="this.remove()">':'')+
 (S.err?'<div class="err">'+esc(S.err)+'</div>':'')+
 '<p><button class="pri" onclick="saveMenu()">'+(S.edit?'Simpan perubahan':'Tambah menu')+'</button> '+(S.edit?'<button class="garis" onclick="batalMenu()">Batal</button>':'')+'</p><h3>Daftar menu ('+D.menu.length+')</h3>';
 D.menu.forEach(function(x){
  var src=fotoSrc(x);
  h+='<div class="baris"><span style="display:flex;gap:.6rem;align-items:center">'+(src?'<img class="mini" src="'+esc(src)+'" alt="" onerror="this.style.visibility=\'hidden\'">':'<span class="mini"></span>')+
  '<span><b>'+esc(x.nama)+'</b><br><small class="muted">'+(KAT[x.kategori]||esc(x.kategori))+' · '+rp(x.harga)+' · stok '+x.stok+'</small></span></span>'+
  '<span><button class="garis kecil" onclick="editMenu('+x.id+')">Ubah</button> <button class="bahaya kecil" onclick="delMenu('+x.id+')">Hapus</button></span></div>';
 });
 return h+'</section></main>';
}

// ===== Laporan (admin) =====
function dayKey(t){var d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function laporanView(){
 var o=D.orders,today=dayKey(Date.now());
 var td=o.filter(function(x){return dayKey(x.created_at)===today});
 var sum=function(a){return a.reduce(function(s,x){return s+Number(x.total)},0)};
 var jml=td.reduce(function(s,x){return s+(x.items||[]).reduce(function(a,i){return a+i.qty},0)},0);
 var h='<main><section class="lebar"><h2>Laporan Penjualan</h2><div class="stats">'+
 '<div class="stat">Pendapatan hari ini<b>'+rp(sum(td))+'</b></div><div class="stat">Pesanan hari ini<b>'+td.length+'</b></div><div class="stat">Item terjual<b>'+jml+'</b></div></div>';
 var days=[];for(var d=6;d>=0;d--){var t=Date.now()-d*86400000,k=dayKey(t);days.push({l:new Date(t).toLocaleDateString('id-ID',{weekday:'short'}),v:sum(o.filter(function(x){return dayKey(x.created_at)===k}))})}
 var mx=Math.max.apply(null,days.map(function(x){return x.v}).concat([1]));
 h+='<h3>7 hari terakhir</h3><div class="bars">'+days.map(function(x){return '<div title="'+rp(x.v)+'"><i style="height:'+Math.round(x.v/mx*100)+'%"></i>'+x.l+'</div>'}).join('')+'</div>';
 var cnt={};o.forEach(function(x){(x.items||[]).forEach(function(i){cnt[i.nama]=(cnt[i.nama]||0)+i.qty})});
 var top=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]}).slice(0,5);
 h+='<h3>Menu terlaris</h3>'+(top.length?top.map(function(n){return '<div class="baris"><span>'+esc(n)+'</span><b>'+cnt[n]+' terjual</b></div>'}).join(''):'<p class="muted">Belum ada penjualan.</p>');
 var pc={};o.forEach(function(x){pc[x.pay]=(pc[x.pay]||0)+Number(x.total)});
 h+='<h3>Per metode pembayaran</h3>'+(Object.keys(pc).length?Object.keys(pc).map(function(k){return '<div class="baris"><span>'+esc(k)+'</span><b>'+rp(pc[k])+'</b></div>'}).join(''):'<p class="muted">Belum ada transaksi.</p>');
 h+='<p><button class="garis" onclick="loadAll()">Segarkan data</button></p></section></main>';
 return h;
}

// ===== Akun =====
function gantiSandiku(){
 var o=$('po').value,n=$('pn').value,c=$('pc').value;
 if(n.length<6){S.e1='Sandi baru minimal 6 karakter.';draw();return}
 if(n!==c){S.e1='Konfirmasi sandi tidak sama.';draw();return}
 sb.auth.signInWithPassword({email:S.user.u+'@storycafe.app',password:o}).then(function(r){
  if(r.error){S.e1='Sandi lama salah.';draw();return}
  return sb.auth.updateUser({password:n}).then(function(u){
   if(u.error){S.e1=u.error.message;draw();return}
   S.e1='';say('Sandi berhasil diganti');
  });
 }).catch(function(e){S.e1=pesanError(e);draw()});
}
function akunView(){
 var h='<main><section><h2>Ganti Sandi Saya</h2><p class="muted">Akun: '+esc(S.user.u)+'</p>'+
 '<label for="po">Sandi lama</label><input id="po" type="password" autocomplete="current-password">'+
 '<label for="pn">Sandi baru (minimal 6 karakter)</label><input id="pn" type="password" autocomplete="new-password">'+
 '<label for="pc">Ulangi sandi baru</label><input id="pc" type="password" autocomplete="new-password">'+
 (S.e1?'<div class="err">'+esc(S.e1)+'</div>':'')+'<button class="pri" onclick="gantiSandiku()">Simpan sandi</button></section>';
 if(S.user.role==='admin'){
  h+='<section class="lebar"><h2>Daftar Akun</h2>';
  D.profiles.forEach(function(x){h+='<div class="baris"><span><b>'+esc(x.username)+'</b></span><span class="badge">'+esc(x.role)+'</span></div>'});
  h+='<p class="muted">Tambah akun baru dan reset sandi akun lain dilakukan lewat dashboard Supabase (Authentication, lalu Users).</p></section>';
 }
 return h+'</main>';
}

// ===== Kerangka =====
function setTab(t){S.tab=t;S.err='';S.e1='';S.edit=null;S.f=null;S.blob=null;S.prev='';draw()}
function draw(){
 var app=$('app');
 if(!S.user){app.innerHTML=loginView();return}
 var admin=S.user.role==='admin',n=aktif(),lbl='Pesanan'+(n?' ('+n+')':'');
 var tabs=admin?[['pesanan',lbl],['menu','Kelola Menu'],['laporan','Laporan'],['akun','Akun']]:[['kasir','Pesan'],['pesanan',lbl]];
 if(!tabs.some(function(t){return t[0]===S.tab}))S.tab=tabs[0][0];
 var v;
 if(S.fatal)v='<main><section><h2>Tidak bisa memuat data</h2><p class="err">'+esc(S.fatal)+'</p><button class="pri" onclick="loadAll()">Coba lagi</button></section></main>';
 else if(S.loading&&!D.menu.length)v='<main><section><p class="muted">Memuat data…</p></section></main>';
 else v=S.tab==='kasir'?kasirView():S.tab==='pesanan'?pesananView():S.tab==='menu'?menuView():S.tab==='laporan'?laporanView():akunView();
 app.innerHTML='<div class="nav">'+tabs.map(function(t){return '<button class="'+(S.tab===t[0]?'on':'')+'" onclick="setTab(\''+t[0]+'\')">'+t[1]+'</button>'}).join('')+
 '<button class="garis kecil" onclick="logout()">Keluar</button></div>'+v+
 (S.toast?'<div class="toast" role="status">'+esc(S.toast)+'</div>':'');
}
setInterval(function(){
 if(S.user&&!S.loading&&(S.tab==='pesanan'||S.tab==='laporan')){loadOrders().then(draw).catch(function(){})}
},10000);

// Selalu mulai dari layar pilihan peran (hapus sesi lama di browser)
draw();
sb.auth.signOut();