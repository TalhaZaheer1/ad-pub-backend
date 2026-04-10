const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'ad-pub-system/assets';
    if (req.params.id) folder = `ad-pub-system/ads/${req.params.id}`;

    // Map the file extension
    const ext = path.extname(file.originalname).substring(1);
    
    // Default format logic if needed, but auto handles most cases
    // We allow raw files for indesign snippets (.idms) and design files (.indt, etc)
    const isRaw = ['idms', 'xml', 'txt', 'csv', 'zip', 'pdf'].includes(ext.toLowerCase());
    
    return {
      folder: folder,
      format: isRaw ? undefined : ext, // auto for images 
      resource_type: isRaw ? 'raw' : 'auto',
      public_id: `${Date.now()}-${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_')}`
    };
  },
});

const upload = multer({ storage: storage });

module.exports = {
  upload,
  cloudinary
};
