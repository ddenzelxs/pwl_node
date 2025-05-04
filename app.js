const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true })); 

const mahasiswaData = require('./mahasiswa.json');
const suratData = require('./surat.json');

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
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index');
});

// Upload PDF
app.post('/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.redirect('/');
});

app.get('/manager', (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  res.render('manager', { files });
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

  const newSurat = {
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
  const nrp = req.params.nrp;
  const kaprodi = kaprodiData.find(k => k.nrp === nrp);

  const filteredSurat = suratData
    .map(s => {
      const mhs = mahasiswaData.find(m => m.nrp === s.nrp);
      return {
        nrp: s.nrp,
        nama: mhs.nama,
        fakultas: mhs.fakultas,
        jurusan: mhs.jurusan,
        jenis_surat: s.jenis_surat,
        status_approved: s.status_approved
      };
    });

  res.render('kaprodi', { surat: filteredSurat });
});
const suratFilePath = path.join(__dirname, 'surat.json');

// Approve surat
app.post('/kaprodi/approve', (req, res) => {
  const { nrp, jenis_surat, kaprodi_nrp } = req.body;

  let suratList = JSON.parse(fs.readFileSync(suratFilePath));
  const index = suratList.findIndex(s => s.nrp === nrp && s.jenis_surat === jenis_surat);

  if (index !== -1) {
    suratList[index].status_approved = 'Disetujui';
    fs.writeFileSync(suratFilePath, JSON.stringify(suratList, null, 2));
    console.log("Surat berhasil diupdate.");
  } else {
    console.log("Surat tidak ditemukan.");
  }

  res.redirect(`/kaprodi/${kaprodi_nrp}`);
});

// Decline surat
app.post('/kaprodi/decline', (req, res) => {
  const { nrp, jenis } = req.body;
  const suratList = JSON.parse(fs.readFileSync(suratFilePath));

  const index = suratList.findIndex(s => s.nrp === nrp && s.jenis === jenis);
  if (index !== -1) {
    suratList[index].status = 'declined';
    fs.writeFileSync(suratFilePath, JSON.stringify(suratList, null, 2));
  }

  res.redirect(`/kaprodi/${nrp}`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
const kaprodiData = require('./kaprodi.json');

