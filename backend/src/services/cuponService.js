const pool = require('../config/database');

class CuponService {
  async getAll() {
    const [rows] = await pool.execute(
      `SELECT id, codigo, descripcion, descuento_pct, vigente_desde, vigente_hasta, activo
       FROM CUPON
       ORDER BY id DESC`
    );
    return rows;
  }

  async getByCode(codigo) {
    if (!codigo) {
      throw new Error('Código de cupón requerido');
    }

    const [rows] = await pool.execute(
      `SELECT id, codigo, descripcion, descuento_pct, vigente_desde, vigente_hasta, activo
       FROM CUPON
       WHERE codigo = ?`,
      [codigo.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      throw new Error('Cupón no válido');
    }

    const cupon = rows[0];
    if (!cupon.activo) {
      throw new Error('Cupón no está activo');
    }

    const now = new Date();
    if (cupon.vigente_desde && now < new Date(cupon.vigente_desde)) {
      throw new Error('Cupón aún no está vigente');
    }

    if (cupon.vigente_hasta && now > new Date(cupon.vigente_hasta)) {
      throw new Error('Cupón expirado');
    }

    return cupon;
  }

  async create(cuponData) {
    const { codigo, descripcion, descuento_pct, vigente_desde, vigente_hasta, activo = true } = cuponData;
    if (!codigo || !descuento_pct) {
      throw new Error('Código y descuento son requeridos para crear un cupón');
    }

    const [result] = await pool.execute(
      `INSERT INTO CUPON (codigo, descripcion, descuento_pct, vigente_desde, vigente_hasta, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo.trim().toUpperCase(), descripcion || '', Number(descuento_pct), vigente_desde || null, vigente_hasta || null, activo ? 1 : 0]
    );

    return this.getByCode(codigo);
  }
}

module.exports = new CuponService();
