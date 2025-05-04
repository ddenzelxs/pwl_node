const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true })); 

const mahasiswaData = require('./mahasiswa.json');
const suratData = require('./surat.json');
app.set('view engine', 'ejs');
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage }); // ← Ini yang harus ada

app.get('/', (req, res) => {
  res.render('index');
});

// Manager
app.get('/manager/:nrp', (req, res) => {
  const nrp = req.params.nrp;

  // Ambil semua surat dan gabungkan dengan data mahasiswa
  const suratWithMahasiswa = suratData.map(surat => {
    const mhs = mahasiswaData.find(m => m.nrp === surat.nrp);
    return {
      ...surat,
      nama: mhs?.nama || 'Tidak ditemukan'
    };
  });

  res.render('manager', { suratList: suratWithMahasiswa, manager_nrp: nrp });
});


app.post('/manager/:nrp/upload-pdf', upload.single('pdf'), (req, res) => {
  const manager_nrp = req.params.nrp;

  if (!req.file) return res.status(400).send('No file uploaded.');

  const { id_surat } = req.body;
  if (id_surat) {
    const suratList = JSON.parse(fs.readFileSync('./surat.json'));
    const index = suratList.findIndex(s => s.id_surat === parseInt(id_surat));
    if (index !== -1) {
      suratList[index].file = req.file.filename;
      fs.writeFileSync('./surat.json', JSON.stringify(suratList, null, 2));
    }
  }

  res.redirect(`/manager/${manager_nrp}`);
});



// Mahasiswa
app.get('/mahasiswa/:nrp', (req, res) => {
  const nrp = req.params.nrp;
  const mahasiswa = mahasiswaData.find(mhs => mhs.nrp === nrp);

  if (!mahasiswa) return res.status(404).send('Mahasiswa tidak ditemukan');

  const surat = suratData.filter(s => s.nrp === nrp);

  res.render('mahasiswa', {
    mahasiswa: mahasiswa,
    surat: surat
  });
});

app.post('/mahasiswa/:nrp/tambah-surat', (req, res) => {
  const nrp = req.params.nrp;
  const { jenis } = req.body;

  const mahasiswaData = require('./mahasiswa.json');
  const suratData = require('./surat.json');

  const mahasiswa = mahasiswaData.find(mhs => mhs.nrp === nrp);
  if (!mahasiswa) return res.status(404).send('Mahasiswa tidak ditemukan');

  const lastId = suratData.length > 0 ? suratData[suratData.length - 1].id_surat || 0 : 0;
  const newId = lastId + 1;

  const newSurat = {
    id_surat: newId,
    nrp: mahasiswa.nrp,
    jenis_surat: jenis,
    status_approved: 'Pending',
    file: null
  };

  suratData.push(newSurat);
  fs.writeFileSync('./surat.json', JSON.stringify(suratData, null, 2));

  res.redirect(`/mahasiswa/${nrp}`);
});


app.get('/kaprodi/:nrp_kaprodi', (req, res) => {
  const nrp_kaprodi = req.params.nrp_kaprodi;
  const kaprodi = kaprodiData.find(k => k.nrp_kaprodi === nrp_kaprodi);
  
  if (!kaprodi) return res.status(404).send('Kaprodi tidak ditemukan');

  const filteredSurat = suratData.map(s => {
    const mhs = mahasiswaData.find(m => m.nrp === s.nrp);
    return {
      id_surat: s.id_surat,
      nrp: s.nrp,
      nama: mhs?.nama || '',
      fakultas: mhs?.fakultas || '',
      jurusan: mhs?.jurusan || '',
      jenis_surat: s.jenis_surat,
      status_approved: s.status_approved
    };
  });

  res.render('kaprodi', {
    surat: filteredSurat,
    kaprodi_nrp: nrp_kaprodi
  });
});

const suratFilePath = path.join(__dirname, 'surat.json');

// Approve surat
app.post('/kaprodi/approve', (req, res) => {
  const { id_surat, kaprodi_nrp } = req.body;

  let suratList = JSON.parse(fs.readFileSync(suratFilePath));
  const index = suratList.findIndex(s => s.id_surat == id_surat);

  if (index !== -1) {
    suratList[index].status_approved = 'Disetujui';
    fs.writeFileSync(suratFilePath, JSON.stringify(suratList, null, 2));
    console.log(`Surat id ${id_surat} disetujui`);
  } else {
    console.log(`Surat dengan id ${id_surat} tidak ditemukan`);
  }

  res.redirect(`/kaprodi/${kaprodi_nrp}`);
});

// Approve surat
app.post('/kaprodi/approve', (req, res) => {
  const { id_surat, kaprodi_nrp } = req.body;

  let suratList = JSON.parse(fs.readFileSync(suratFilePath));
  const index = suratList.findIndex(s => s.id_surat == id_surat);

  if (index !== -1) {
    suratList[index].status_approved = 'Ditolak';
    fs.writeFileSync(suratFilePath, JSON.stringify(suratList, null, 2));
    console.log(`Surat id ${id_surat} disetujui`);
  } else {
    console.log(`Surat dengan id ${id_surat} tidak ditemukan`);
  }

  res.redirect(`/kaprodi/${kaprodi_nrp}`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
const kaprodiData = require('./kaprodi.json');

