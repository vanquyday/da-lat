/* =========================================================
   DỮ LIỆU CHUYẾN ĐI — sửa lịch trình, ảnh, nhạc ở file này
   ========================================================= */

/* Lịch trình. pass:true = dòng chuyển cảnh (không có khung ảnh) */
const DAYS = [
 { n:1, date:"07/10", wd:"Thứ Tư", name:"Hạ cánh xuống phố sương", stops:[
   {id:"d1-bay", t:"12:00", title:"Bay từ Hà Nội đến Đà Lạt", pass:true},
   {id:"d1-sanbay", t:"14:00", title:"Tới sân bay Đà Lạt", pass:true},
   {id:"d1-villa", t:"15:00", title:"Gặp nhau tại Tân Villa 2", note:"Cất đồ, nghỉ ngơi, 15h30 khởi hành.", km:"33km từ sân bay"},
   {id:"d1-hxh", t:"16:00", title:"Hồ Xuân Hương & Dốc Sương Nguyệt Ánh"},
   {id:"d1-lau", t:"19:00", title:"Lẩu gà lá é Tao Ngộ", note:"Số 5 đường 3 Tháng 4, Đà Lạt."},
   {id:"d1-chodem", t:"20:00", title:"Chợ đêm Đà Lạt", note:"Check in góc Hongkong."},
   {id:"d1-ngu", t:"22:00", title:"Về nghỉ ngơi sớm", note:"Mai cần dậy sớm săn mây", pass:true}
 ]},
 { n:2, date:"08/10", wd:"Thứ Năm", name:"Săn mây đến khuya",
   fork:{
     q:"Sáng sớm săn mây ở đâu?",
     a:{label:"Phương án 1", sub:"Ưu tiên · tiện ghé đường hầm Hỏa Xa", stops:[
       {id:"d2a-xuatphat", t:"04:00", title:"Dậy, makeup, lên đường tới đồi chè Cầu Đất", note:"Khoảng 25,9km từ Villa, đi khoảng 1 tiếng.", pass:true},
       {id:"d2a-caudat", t:"05:00", title:"Đồi chè Cầu Đất", note:"Có mặt để săn mây."},
       {id:"d2a-hoaxa", t:"07:00", title:"Đường hầm Hỏa Xa", note:"Ăn sáng gần đồi chè Cầu Đất, hoặc về thành phố thử Bánh mì xíu mại Vân (Yersin).", km:"5km từ Cầu Đất"}
     ]},
     b:{label:"Phương án 2", sub:"Gần hơn · cách Villa 12km", stops:[
       {id:"d2b-thienphucduc", t:"04:30", title:"Đồi Thiên Phúc Đức", note:"Săn mây, dậy tầm 04:30 là đẹp. Gần Villa nên dễ di chuyển hơn.", km:"12km từ Villa"},
       {id:"d2b-banhmi", t:"07:00", title:"Bánh mì xíu mại Vân (Yersin)"}
     ]}
   },
   stops:[
   {id:"d2-domaine", t:"08:00", title:"Nhà thờ Domaine", note:"Về thành phố, ghé nhà thờ."},
   {id:"d2-lamvien", t:"10:00", title:"Quảng trường Lâm Viên"},
   {id:"d2-hoino", t:"12:00", title:"Tiệm cơm Hồi Nớ Đà Lạt"},
   {id:"d2-villa", t:"13:00", title:"Về Villa nghỉ ngơi", pass:true},
   {id:"d2-nhohoai", t:"15:00", title:"Dốc Nhớ Hoài & Cafe Hoài", note:"Bối cảnh trong phim Em & Trịnh.", km:"2km từ Villa"},
   {id:"d2-namphuong", t:"16:00", title:"Cung Nam Phương Hoàng Hậu", km:"1km từ Dốc Nhớ"},
   {id:"d2-xomleo", t:"17:00", title:"Ngắm hoàng hôn Xóm Lèo", note:"Quán cafe ngắm hoàng hôn.", km:"5km"},
   {id:"d2-nuong", t:"19:00", title:"Ăn nướng tại Trạm Dừng Chill", note:"Hoặc Tiệm nướng và Chill Xóm Lèo.", km:"2km"},
   {id:"d2-vuthi", t:"20:00", title:"Làng Vũ Thị", note:"Ngắm thung lũng đèn.", km:"1km"},
   {id:"d2-vinaphone", t:"21:00", title:"Tháp Vinaphone", note:"Sữa đậu nóng.", km:"8km"},
   {id:"d2-ngu", t:"22:00", title:"Về nghỉ ngơi sớm", note:"Đi cả ngày mệt phết rồi · 2km", pass:true}
 ]},
 { n:3, date:"09/10", wd:"Thứ Sáu", name:"Dinh thự, phố cũ và đêm nhạc", stops:[
   {id:"d3-banhcan", t:"07:00", title:"Bánh căn A Tý", km:"2km"},
   {id:"d3-minhhoa", t:"08:00", title:"Đại Chủng Viện Minh Hòa", km:"7km"},
   {id:"d3-dinh3", t:"10:00", title:"Dinh 3 Bảo Đại", km:"9km"},
   {id:"d3-villa", t:"13:00", title:"Về Villa nghỉ ngơi", note:"4km", pass:true},
   {id:"d3-doimotnguoi", t:"15:00", title:"Đợi Một Người Đà Lạt", km:"9km"},
   {id:"d3-cataam", t:"18:00", title:"Lẩu cá tầm Tuyên", km:"9km"},
   {id:"d3-binhminhoi", t:"20:00", title:"Đêm nhạc Bình Minh Ơi", km:"7km"},
   {id:"d3-ngu", t:"22:00", title:"Về nghỉ ngơi sớm", note:"Mai cần dậy sớm", pass:true}
 ]},
 { n:4, date:"10/10", wd:"Thứ Bảy", name:"Đồi hồng và lời tạm biệt", stops:[
   {id:"d4-manglin", t:"06:00", title:"Đồi cỏ hồng Măng Lin, Đồi Đa Phú", km:"13km"},
   {id:"d4-xoica", t:"08:00", title:"Xôi cá Phạm Hồng Thái", km:"13km"},
   {id:"d4-cho", t:"09:00", title:"Chợ mua quà lưu niệm", km:"2km"},
   {id:"d4-traphong", t:"12:00", title:"Về Villa trả phòng", pass:true},
   {id:"d4-luungchung", t:"13:00", title:"Tiệm Gà Lưng Chừng Đồi", km:"2km"},
   {id:"d4-cheoveo", t:"15:00", title:"Tiệm cà phê Cheo veooo", km:"6km"},
   {id:"d4-saigon", t:"17:00", title:"Trả xe và đi Sài Gòn", pass:true}
 ]}
];

/* Diễn viên & ảnh đại diện */
const CAST = ["Quý","Lệ","Long","Nhi"];
const AVATAR = {
  "Quý": "images/avatars/quy.webp",
  "Lệ": "images/avatars/le.webp",
  "Long": "images/avatars/long.webp",
  "Nhi": "images/avatars/nhi.webp"
};

/* Ảnh từng điểm đến (theo id trong lịch trình) */
const PHOTO = {
  "d1-villa": "images/d1-villa.webp",
  "d1-hxh": "images/d1-hxh.webp",
  "d1-lau": "images/d1-lau.webp",
  "d1-chodem": "images/d1-chodem.webp",
  "d2a-caudat": "images/d2a-caudat.webp",
  "d2a-hoaxa": "images/d2a-hoaxa.webp",
  "d2b-thienphucduc": "images/d2b-thienphucduc.webp",
  "d2b-banhmi": "images/d2b-banhmi.webp",
  "d2-domaine": "images/d2-domaine.webp",
  "d2-lamvien": "images/d2-lamvien.webp",
  "d2-hoino": "images/d2-hoino.webp",
  "d2-nhohoai": "images/d2-nhohoai.webp",
  "d2-namphuong": "images/d2-namphuong.webp",
  "d2-xomleo": "images/d2-xomleo.webp",
  "d2-nuong": "images/d2-nuong.webp",
  "d2-vuthi": "images/d2-vuthi.webp",
  "d2-vinaphone": "images/d2-vinaphone.webp",
  "d3-banhcan": "images/d3-banhcan.webp",
  "d3-minhhoa": "images/d3-minhhoa.webp",
  "d3-dinh3": "images/d3-dinh3.webp",
  "d3-doimotnguoi": "images/d3-doimotnguoi.webp",
  "d3-cataam": "images/d3-cataam.webp",
  "d3-binhminhoi": "images/d3-binhminhoi.webp",
  "d4-manglin": "images/d4-manglin.webp",
  "d4-xoica": "images/d4-xoica.webp",
  "d4-cho": "images/d4-cho.webp",
  "d4-luungchung": "images/d4-luungchung.webp",
  "d4-cheoveo": "images/d4-cheoveo.webp"
};

/* Ảnh nền mờ phía sau (bản nhỏ đã làm mờ sẵn). Nếu thiếu, trang tự làm mờ ảnh chính. */
const PHOTO_BG = {
  "d1-villa": "images/blur/d1-villa.jpg",
  "d1-hxh": "images/blur/d1-hxh.jpg",
  "d1-lau": "images/blur/d1-lau.jpg",
  "d1-chodem": "images/blur/d1-chodem.jpg",
  "d2a-caudat": "images/blur/d2a-caudat.jpg",
  "d2a-hoaxa": "images/blur/d2a-hoaxa.jpg",
  "d2b-thienphucduc": "images/blur/d2b-thienphucduc.jpg",
  "d2b-banhmi": "images/blur/d2b-banhmi.jpg",
  "d2-domaine": "images/blur/d2-domaine.jpg",
  "d2-lamvien": "images/blur/d2-lamvien.jpg",
  "d2-hoino": "images/blur/d2-hoino.jpg",
  "d2-nhohoai": "images/blur/d2-nhohoai.jpg",
  "d2-namphuong": "images/blur/d2-namphuong.jpg",
  "d2-xomleo": "images/blur/d2-xomleo.jpg",
  "d2-nuong": "images/blur/d2-nuong.jpg",
  "d2-vuthi": "images/blur/d2-vuthi.jpg",
  "d2-vinaphone": "images/blur/d2-vinaphone.jpg",
  "d3-banhcan": "images/blur/d3-banhcan.jpg",
  "d3-minhhoa": "images/blur/d3-minhhoa.jpg",
  "d3-dinh3": "images/blur/d3-dinh3.jpg",
  "d3-doimotnguoi": "images/blur/d3-doimotnguoi.jpg",
  "d3-cataam": "images/blur/d3-cataam.jpg",
  "d3-binhminhoi": "images/blur/d3-binhminhoi.jpg",
  "d4-manglin": "images/blur/d4-manglin.jpg",
  "d4-xoica": "images/blur/d4-xoica.jpg",
  "d4-cho": "images/blur/d4-cho.jpg",
  "d4-luungchung": "images/blur/d4-luungchung.jpg",
  "d4-cheoveo": "images/blur/d4-cheoveo.jpg"
};

/* Nhạc nền */
const MUSIC_SRC = "audio/nhac-nen.mp3";
