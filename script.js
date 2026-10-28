let menu = [
  // ☕ Menu Kopi
  { id: 1, kategori: "kopi", nama: "Chapter One Espresso", harga: 18000 },
  { id: 2, kategori: "kopi", nama: "The Main Character", harga: 25000 },
  { id: 3, kategori: "kopi", nama: "Cliffhanger Americano", harga: 22000 },
  { id: 4, kategori: "kopi", nama: "Plot Twist Latte", harga: 24000 },
  { id: 5, kategori: "kopi", nama: "Foreshadowing Frappe", harga: 26000 },
  { id: 6, kategori: "kopi", nama: "Epilogue Espresso", harga: 23000 },
  { id: 7, kategori: "kopi", nama: "Mystery Mocha", harga: 20000 },

  // 🍹 Menu Non-Kopi
  { id: 8, kategori: "nonkopi", nama: "Tropical Tale Tea", harga: 18000 },
  { id: 9, kategori: "nonkopi", nama: "Lemon Plot", harga: 16000 },
  { id: 10, kategori: "nonkopi", nama: "Fantasy Fizz", harga: 19000 },
  { id: 11, kategori: "nonkopi", nama: "Berry Chronicle", harga: 20000 },
  { id: 12, kategori: "nonkopi", nama: "Mint Mystery", harga: 18000 },
  { id: 13, kategori: "nonkopi", nama: "Twist Tea", harga: 17000 },
  { id: 14, kategori: "nonkopi", nama: "Classic Citrus", harga: 15000 },

  // 🍟 Makanan Ringan
  { id: 15, kategori: "makanan", nama: "Narrative Nachos", harga: 20000 },
  { id: 16, kategori: "makanan", nama: "Plot Popcorn", harga: 15000 },
  { id: 17, kategori: "makanan", nama: "Twist Fries", harga: 18000 },
  { id: 18, kategori: "makanan", nama: "Character Chips", harga: 16000 },
  { id: 19, kategori: "makanan", nama: "Suspense Stick", harga: 17000 },

  // 🍰 Dessert
  { id: 20, kategori: "dessert", nama: "Sweet Epilogue", harga: 22000 },
  { id: 21, kategori: "dessert", nama: "Drama Donut", harga: 20000 },
  { id: 22, kategori: "dessert", nama: "Cliff Cake", harga: 24000 },
  { id: 23, kategori: "dessert", nama: "Mystery Muffin", harga: 21000 },
  { id: 24, kategori: "dessert", nama: "Ending Eclair", harga: 23000 },
];

let queue = [];
let stacks = {};
let customerNumber = 1;

function displayMenu() {
  const list = document.getElementById("menuList");
  list.innerHTML = "";
  const kategoriList = ["kopi", "nonkopi", "makanan", "dessert"];
  const kategoriJudul = {
    kopi: "☕ Menu Kopi",
    nonkopi: "🍹 Menu Non-Kopi",
    makanan: "🍟 Makanan Ringan",
    dessert: "🍰 Dessert"
  };

  kategoriList.forEach((kategori) => {
    const header = document.createElement("h3");
    header.textContent = kategoriJudul[kategori];
    list.appendChild(header);

    menu.filter((item) => item.kategori === kategori).forEach((item) => {
      const div = document.createElement("div");
      div.innerHTML = `${item.nama} - Rp${item.harga} <button onclick="addToCart(${item.id})">Pilih</button>`;
      list.appendChild(div);
    });
  });
}

displayMenu();

function addCustomer() {
  const name = document.getElementById("customerName").value;
  if (!name) return alert("Nama pelanggan wajib diisi!");

  const customer = { name, number: customerNumber++ };
  queue.push(customer);
  stacks[customer.number] = [];

  updateQueue();
  document.getElementById("customerName").value = "";

  if (queue.length === 1) startOrder();
}

function updateQueue() {
  const display = document.getElementById("queueDisplay");
  display.innerHTML = queue.map(c => `#${c.number} - ${c.name}`).join("<br>");
}

function startOrder() {
  if (queue.length === 0) return;
  document.getElementById("orderSection").style.display = "block";
  updateCart();
}

function addToCart(id) {
  const current = queue[0].number;
  const item = menu.find(m => m.id === id);
  stacks[current].push(item);
  updateCart();
}

function updateCart() {
  const cart = document.getElementById("cartItems");
  const current = queue[0].number;
  const stack = stacks[current];
  cart.innerHTML = "";
  let total = 0;

  stack.slice().reverse().forEach(item => {
    const div = document.createElement("div");
    div.textContent = `${item.nama} - Rp${item.harga}`;
    cart.appendChild(div);
    total += item.harga;
  });

  document.getElementById("totalPrice").textContent = `Rp${total}`;
}

function checkout() {
  if (queue.length === 0) return;

  const current = queue.shift();
  const items = stacks[current.number];
  const metode = document.getElementById("paymentMethod").value;

  let struk = "====== THE STORY CAFÉ ======\n";
  struk += `Nomor Antrian: ${current.number}\n`;
  struk += `Nama: ${current.name}\n`;
  struk += "----------------------------\n";
  let total = 0;
  items.reverse().forEach(item => {
    struk += `${item.nama} - Rp${item.harga}\n`;
    total += item.harga;
  });
  struk += "----------------------------\n";
  struk += `Total: Rp${total}\n`;
  struk += `Metode Bayar: ${metode}\n`;
  struk += "============================";

  document.getElementById("receiptSection").innerText = struk;
  document.getElementById("orderSection").style.display = "none";
  delete stacks[current.number];
  updateQueue();

  if (queue.length > 0) startOrder();
}

function resetOrder() {
  const current = queue[0];
  stacks[current.number] = [];
  updateCart();
  document.getElementById("receiptSection").innerText = "";
}