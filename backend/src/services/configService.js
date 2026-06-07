const pool = require('../config/database');

const DEFAULT_CONFIG = {
  capacidad_diaria: 10,
  politica_cancelacion: 'La cancelación debe hacerse con al menos 24 horas de antelación para evitar cargos. Las cancelaciones a última hora pueden ser rechazadas o sujetas a un cobro parcial.',
  bank_qr_url: '',
  horario_inicio: '09:00',
  horario_fin: '18:00',
  dias_trabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
};

class ConfigService {
  async ensureConfigRow() {
    const [rows] = await pool.execute('SELECT id FROM CONFIGURACION LIMIT 1');
    if (rows.length === 0) {
      await pool.execute(
        'INSERT INTO CONFIGURACION (capacidad_diaria, politica_cancelacion, bank_qr_url, horario_inicio, horario_fin, dias_trabajo) VALUES (?, ?, ?, ?, ?, ?)',
        [
          DEFAULT_CONFIG.capacidad_diaria,
          DEFAULT_CONFIG.politica_cancelacion,
          DEFAULT_CONFIG.bank_qr_url,
          DEFAULT_CONFIG.horario_inicio,
          DEFAULT_CONFIG.horario_fin,
          JSON.stringify(DEFAULT_CONFIG.dias_trabajo)
        ]
      );
    }
  }

  async getConfig() {
    await this.ensureConfigRow();
    const [rows] = await pool.execute(
      'SELECT id, capacidad_diaria, politica_cancelacion, bank_qr_url, horario_inicio, horario_fin, dias_trabajo FROM CONFIGURACION LIMIT 1'
    );
    if (rows.length === 0) {
      return DEFAULT_CONFIG;
    }

    let diasTrabajo = DEFAULT_CONFIG.dias_trabajo;
    const diasTrabajoRaw = rows[0].dias_trabajo;
    if (diasTrabajoRaw) {
      try {
        diasTrabajo = typeof diasTrabajoRaw === 'string' ? JSON.parse(diasTrabajoRaw) : diasTrabajoRaw;
      } catch {
        diasTrabajo = DEFAULT_CONFIG.dias_trabajo;
      }
    }

    return {
      capacidad_diaria: rows[0].capacidad_diaria ?? DEFAULT_CONFIG.capacidad_diaria,
      politica_cancelacion: rows[0].politica_cancelacion || DEFAULT_CONFIG.politica_cancelacion,
      bank_qr_url: rows[0].bank_qr_url || DEFAULT_CONFIG.bank_qr_url,
      horario_inicio: rows[0].horario_inicio || DEFAULT_CONFIG.horario_inicio,
      horario_fin: rows[0].horario_fin || DEFAULT_CONFIG.horario_fin,
      dias_trabajo: diasTrabajo
    };
  }

  async updateConfig(data = {}) {
    await this.ensureConfigRow();
    const { capacidad_diaria, politica_cancelacion, bank_qr_url, horario_inicio, horario_fin, dias_trabajo } = data;
    const query = `UPDATE CONFIGURACION SET capacidad_diaria = ?, politica_cancelacion = ?, bank_qr_url = ?, horario_inicio = ?, horario_fin = ?, dias_trabajo = ?`;
    await pool.execute(query, [
      Number(capacidad_diaria) || DEFAULT_CONFIG.capacidad_diaria,
      politica_cancelacion || DEFAULT_CONFIG.politica_cancelacion,
      bank_qr_url || DEFAULT_CONFIG.bank_qr_url,
      horario_inicio || DEFAULT_CONFIG.horario_inicio,
      horario_fin || DEFAULT_CONFIG.horario_fin,
      JSON.stringify(Array.isArray(dias_trabajo) ? dias_trabajo : DEFAULT_CONFIG.dias_trabajo)
    ]);
    return this.getConfig();
  }
}

module.exports = new ConfigService();
