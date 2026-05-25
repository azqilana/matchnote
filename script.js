
    // --- INTEGRASI CLASS HITUNG SAKTI (OOP DENGAN MODUL OPERASI) ---
class Hitung {
  constructor() {
    // Modul kamus terjemahan bahasa manusia ke operator matematika dasar
    this.kamusOperator = [
      { kata: /di\s*tambah/gi, simbol: '+' },
      { kata: /di\s*kurang/gi, simbol: '-' },
      { kata: /di\s*kali/gi,   simbol: '*' },
      { kata: /x/gi,           simbol: '*' },
      { kata: /×/gi,           simbol: '*' },
      { kata: /di\s*bagi/gi,   simbol: '/' },
      { kata: /÷/gi,           simbol: '/' }
    ];
  }

  // Fungsi tambahan untuk membersihkan tanda operator yang berdekatan
  bersihkanTanda(ekspresi) {
    // Mengubah -- menjadi + (seperti kasus 6--4 menjadi 6+4)
    ekspresi = ekspresi.replace(/--/g, '+');
    // Mengubah +- atau -+ menjadi -
    ekspresi = ekspresi.replace(/\+-|-\+/g, '-');
    return ekspresi;
  }

  // Fungsi tambahan untuk menyelesaikan operasi di dalam kurung terlebih dahulu
  prosesKurung(ekspresi) {
    // Regex untuk mencari kurung terdalam yang tidak berisi kurung lain
    const regexKurung = /\(([^()]+)\)/;

    // Perulangan akan terus berjalan selama masih ada tanda kurung
    while (regexKurung.test(ekspresi)) {
      ekspresi = ekspresi.replace(regexKurung, (match, isiKurung) => {
        try {
          // Hitung operasi di dalam kurung menggunakan fungsi bawaan aman
          const hasilIsi = new Function(`return ${isiKurung}`)();
          return hasilIsi;
        } catch (e) {
          return 0; // Kembalikan 0 jika rumus di dalam kurung rusak
        }
      });

      // Bersihkan tanda setelah kurung diganti dengan angka (antisipasi angka negatif)
      ekspresi = this.bersihkanTanda(ekspresi);
    }
    return ekspresi;
  }

  // Modul Utama: Mengecek text baris terakhir dan memproses perhitungan matematika
  prosesTeks(teksLengkap, posisiKursor) {
    // Ambil teks dari awal hingga batas kursor ketikan saat ini
    const teksHinggaKursor = teksLengkap.substring(0, posisiKursor);
    
    // Pecah baris teks, ambil hanya baris terakhir tempat kursor berada
    const barisBaris = teksHinggaKursor.split('\n');
    const barisTerakhir = barisBaris[barisBaris.length - 1];

    // Terjemahkan kata-kata manusia ke simbol matematika mentah melalui modul kamus
    let teksMurni = barisTerakhir;
    this.kamusOperator.forEach(item => {
      teksMurni = teksMurni.replace(item.kata, item.simbol);
    });

    // SEKARANG MENDUKUNG KURUNG: Karakter ( dan ) tidak akan dihapus
    let ekspresiMatematika = teksMurni.replace(/[^0-9+\-*/.()]/g, '');

    // REGEX PERBAIKAN: Validasi melonggar untuk memastikan ada angka dan operator yang siap dihitung
    const polaValid = /\d+[\+\-\*\/]\d+/;
    
    if (polaValid.test(ekspresiMatematika)) {
      try {
        // Selesaikan semua operasi dalam kurung terlebih dahulu
        ekspresiMatematika = this.prosesKurung(ekspresiMatematika);

        // Modul Eksekusi Akhir: Menghitung sisa ekspresi setelah kurung habis
        const hasilEvaluasi = new Function(`return ${ekspresiMatematika}`)();
        
        if (typeof hasilEvaluasi === 'number' && !isNaN(hasilEvaluasi) && isFinite(hasilEvaluasi)) {
          // Kembalikan nilai hasil jika perhitungannya valid dan sukses
          return Number(hasilEvaluasi.toFixed(2)); 
        }
      } catch (e) {
        return null; // Abaikan jika terjadi eror
      }
    }
    return null; 
  }
}
      // 1. Ambil elemen DOM
      const btnMunculkan = document.getElementById('btn-munculkan');
      const btnTutupCatatan = document.getElementById('btn-tutup-catatan');
      const sectionCatatan = document.getElementById('catatan');
      const menuCatatan = document.querySelector('nav ul li a[href="#catatan"]');
      const formCatatan = document.querySelector('.catatan form');
      const inputJudul = document.getElementById('judul');
      const isiCatatan = document.getElementById('isi-catatan');
      const wadahList = document.getElementById('wadah-list');
      const notif = document.getElementById('notif');
      
      // Elemen DOM Fitur Hapus
      const sectionDaftar = document.getElementById('daftar-catatan');
      const btnMasterHapus = document.getElementById('btn-master-hapus');
      const btnBatalHapus = document.getElementById('btn-batal-hapus');

      // Elemen DOM Fitur Sakti Tooltip
      const tooltip = document.getElementById('tooltip-kalkulator');
      const teksHasilHitung = document.getElementById('teks-hasil-hitung');
      const btnOpsiA = document.getElementById('btn-opsi-a');
      const btnOpsiC = document.getElementById('btn-opsi-c');

      // Inisialisasi Instance Class Hitung & Data Storage
      const mesinHitung = new Hitung();
      let nilaiHasilGlobal = null; 
      let isModeHapus = false;
      let daftarData = [];

      // 2. Real-time Event Listener pada Textarea Kertas Buku
      isiCatatan.addEventListener('input', function() {
        const posisiKursor = isiCatatan.selectionStart;
        const teksSekarang = isiCatatan.value;

        // Jalankan pemindaian lewat Class Hitung
        const hasilHitung = mesinHitung.prosesTeks(teksSekarang, posisiKursor);

        if (hasilHitung !== null) {
          nilaiHasilGlobal = hasilHitung;
          teksHasilHitung.innerText = "Hasil: " + hasilHitung;

          // Mengatur posisi kotak tooltip melayang mengikuti area ketikan bawah
          tooltip.style.display = 'flex';
          tooltip.style.left = '90px'; // Sejajar dengan margin vertikal merah kertas
          tooltip.style.bottom = '10px'; 
        } else {
          tooltip.style.display = 'none';
        }
      });

      // FUNCTION: Menyisipkan hasil ke textarea berdasarkan opsi tombol yang dipilih
      function sisipkanHasil(format) {
        if (nilaiHasilGlobal === null) return;

        const posisiKursor = isiCatatan.selectionStart;
        const teksLama = isiCatatan.value;
        
        // Tentukan template string hasil sesuai keinginan bos (Opsi A atau Opsi C)
        const teksSisipan = (format === 'A') ? ` = ${nilaiHasilGlobal}` : ` (${nilaiHasilGlobal})`;

        // Potong teks lama lalu selipkan hasil hitungan tepat di posisi kursor aktif
        const teksBaru = teksLama.substring(0, posisiKursor) + teksSisipan + teksLama.substring(posisiKursor);
        
        isiCatatan.value = teksBaru;
        tooltip.style.display = 'none'; // Sembunyikan kembali tooltip
        nilaiHasilGlobal = null;

        // Kembalikan fokus kursor ketikan ke textarea setelah tombol diklik
        isiCatatan.focus();
        const posisiKursorBaru = posisiKursor + teksSisipan.length;
        isiCatatan.setSelectionRange(posisiKursorBaru, posisiKursorBaru);
      }

      // Event click untuk tombol pilihan Opsi A dan Opsi C di Tooltip
      btnOpsiA.addEventListener('click', () => sisipkanHasil('A'));
      btnOpsiC.addEventListener('click', () => sisipkanHasil('C'));

      // FUNCTION: Render/Menampilkan data ke dalam list mading riwayat
      function tampilkanDaftar() {
        wadahList.innerHTML = ''; 
        
        if (daftarData.length === 0) {
          wadahList.innerHTML = '<p style="text-align:center; font-style:italic; color:#666;">Belum ada catatan yang disimpan.</p>';
          keluarModeHapus();
          return;
        }

        daftarData.forEach((item, index) => {
          const judulFix = item.judul.trim() === '' ? 'Tanpa Judul' : item.judul;
          
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item-catatan';
          
          itemDiv.innerHTML = `
            <div class="item-judul" onclick="handleKlikList(this, ${index})">
              <span class="teks-judul">${judulFix}</span>
              <button class="btn-hapus-satuan" onclick="hapusSatuCatatan(event, ${index})">Hapus</button>
            </div>
            <div class="item-isi">${item.isi}</div>
          `;
          
          wadahList.appendChild(itemDiv);
        });
      }

      function handleKlikList(elemenJudul, index) {
        if (isModeHapus) return; 
        const itemCatatan = elemenJudul.parentElement;
        itemCatatan.classList.toggle('aktif');
      }

      function hapusSatuCatatan(event, index) {
        event.stopPropagation(); 
        if (confirm('Apakah kamu yakin ingin menghapus catatan ini?')) {
          daftarData.splice(index, 1); 
          simpanKeLokal();
          tampilkanDaftar();
        }
      }

      function keluarModeHapus() {
        isModeHapus = false;
        sectionDaftar.classList.remove('mode-hapus');
        btnMasterHapus.classList.remove('aktif-merah');
        btnMasterHapus.innerText = 'Hapus';
      }

      function simpanKeLokal() {
        localStorage.setItem('smartnote_array_data', JSON.stringify(daftarData));
      }

      function muatDataLokal() {
        const dataLokal = localStorage.getItem('smartnote_array_data');
        if (dataLokal) {
          daftarData = JSON.parse(dataLokal);
        }
        tampilkanDaftar();
      }

      muatDataLokal();

      // Logika Tombol Master Hapus di bawah
      btnMasterHapus.addEventListener('click', function() {
        if (daftarData.length === 0) return; 

        if (!isModeHapus) {
          isModeHapus = true;
          sectionDaftar.classList.add('mode-hapus');
          btnMasterHapus.classList.add('aktif-merah');
          btnMasterHapus.innerText = 'Hapus Semua';
          document.querySelectorAll('.item-catatan').forEach(el => el.classList.remove('aktif'));
        } else {
          if (confirm('PERINGATAN! Apakah kamu yakin ingin MENGHAPUS SEMUA catatan?')) {
            daftarData = []; 
            simpanKeLokal();
            tampilkanDaftar();
          } else {
            keluarModeHapus();
          }
        }
      });

      btnBatalHapus.addEventListener('click', function() {
        keluarModeHapus();
      });

      // Tombol Plus (Muncul/Sembunyi Catatan)
      btnMunculkan.addEventListener('click', function() {
        if (sectionCatatan.style.display === 'none' || sectionCatatan.style.display === '') {
          sectionCatatan.style.display = 'block';
          sectionCatatan.scrollIntoView({ behavior: 'smooth' });
        } else {
          sectionCatatan.style.display = 'none';
          tooltip.style.display = 'none';
        }
        btnMunculkan.classList.remove('tombol-kedip');
      });

      // Tombol Tutup Silang (X)
      btnTutupCatatan.addEventListener('click', function() {
        sectionCatatan.style.display = 'none';
        tooltip.style.display = 'none';
        document.getElementById('sampul').scrollIntoView({ behavior: 'smooth' });
      });

      // Deteksi Klik Menu Navigasi
      menuCatatan.addEventListener('click', function(event) {
        if (sectionCatatan.style.display === 'none' || sectionCatatan.style.display === '') {
          event.preventDefault();
          document.getElementById('sampul').scrollIntoView({ behavior: 'smooth' });
          btnMunculkan.classList.add('tombol-kedip');
          
          setTimeout(() => {
            btnMunculkan.classList.remove('tombol-kedip');
          }, 3200);
        }
      });

      // Proses Penyimpanan Form
      formCatatan.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const catatanBaru = {
          judul: inputJudul.value,
          isi: isiCatatan.value
        };
        
        daftarData.unshift(catatanBaru);
        simpanKeLokal();
        
        keluarModeHapus();
        tampilkanDaftar();
        
        inputJudul.value = '';
        isiCatatan.value = '';
        tooltip.style.display = 'none';
        
        notif.classList.add('muncul');
        setTimeout(() => {
          notif.classList.remove('muncul');
        }, 600);
      });