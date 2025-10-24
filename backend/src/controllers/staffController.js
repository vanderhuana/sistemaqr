const { Staff } = require('../models');
const { generateUniqueQRCode } = require('../utils/qrUtils');

// Registrar nuevo staff
exports.createStaff = async (req, res) => {
  try {
    const { nombre, documento, cargo, fotoUrl } = req.body;
    // Generar QR único
    let qrCode;
    let attempts = 0;
    do {
      qrCode = generateUniqueQRCode(documento, 'staff');
      const exists = await Staff.findOne({ where: { qrCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

    const staff = await Staff.create({ nombre, documento, cargo, fotoUrl, qrCode });
    res.status(201).json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Listar staff
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.findAll();
    res.json({ success: true, staff: staffList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
