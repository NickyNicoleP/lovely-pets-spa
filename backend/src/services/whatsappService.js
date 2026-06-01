const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCode = null;
    this.messageHistory = [];
  }

  /**
   * Initialize WhatsApp client
   */
  async initialize() {
    try {
      if (this.client) {
        return this.client;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'pawspa-client'
        }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // QR Code event
      this.client.on('qr', (qr) => {
        console.log('\n========== WHATSAPP QR CODE ==========');
        qrcode.generate(qr, { small: true });
        console.log('======================================\n');
        this.qrCode = qr;
      });

      // Ready event
      this.client.on('ready', () => {
        console.log('✅ WhatsApp client is ready!');
        this.isConnected = true;
        this.qrCode = null;
      });

      // Authenticated event
      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp client authenticated!');
        this.isConnected = true;
      });

      // Auth failure event
      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isConnected = false;
      });

      // Disconnected event
      this.client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp client disconnected:', reason);
        this.isConnected = false;
        this.client = null;
      });

      // Initialize client
      await this.client.initialize();

      return this.client;
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   * @param {string} phoneNumber - Phone number with country code (e.g., "591XXXXXXXX")
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Result of message send
   */
  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('WhatsApp client is not connected');
      }

      // Format phone number: remove all non-numeric characters
      const clean = phoneNumber.replace(/\D/g, '');
      const chatId = `${clean}@c.us`;

      // Send message
      const response = await this.client.sendMessage(chatId, message);

      // Log message to history
      this.messageHistory.push({
        id: response.id.id,
        to: phoneNumber,
        message,
        status: 'sent',
        timestamp: new Date(),
        type: 'outgoing'
      });

      // Keep only last 100 messages in memory
      if (this.messageHistory.length > 100) {
        this.messageHistory = this.messageHistory.slice(-100);
      }

      console.log(`✅ WhatsApp message sent to ${phoneNumber}`);
      return {
        success: true,
        messageId: response.id.id,
        to: phoneNumber,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Error sending WhatsApp message to ${phoneNumber}:`, error.message);

      // Log failed message
      this.messageHistory.push({
        to: phoneNumber,
        message,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
        type: 'outgoing'
      });

      return {
        success: false,
        error: error.message,
        to: phoneNumber,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send confirmation message for new appointment
   */
  async sendAppointmentConfirmation(clientPhone, clientName, mascotaNombre, fecha, hora) {
    const formattedDate = new Date(fecha).toLocaleDateString('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/La_Paz'
    });

    const message = `Hola ${clientName}! 🐾\n\nTu cita en PawSpa está confirmada:\n\n📅 ${formattedDate}\n🕐 ${hora}\n🐶 ${mascotaNombre}\n\nTe enviaremos un recordatorio 24 horas antes. ¡Gracias por confiar en nosotros! 💕`;

    return this.sendMessage(clientPhone, message);
  }

  /**
   * Send "ready for pickup" message
   */
  async sendReadyForPickup(clientPhone, clientName, mascotaNombre) {
    const message = `¡Hola ${clientName}! 🐾✨\n\n${mascotaNombre} está lista para recoger en PawSpa.\n\n¡Tu mascota se ve hermosa! 💇‍♀️💕`;

    return this.sendMessage(clientPhone, message);
  }

  /**
   * Send critical stock alert to admin
   */
  async sendCriticalStockAlert(adminPhone, productName, currentStock, minStock) {
    const message = `⚠️ ALERTA DE STOCK CRÍTICO\n\nProducto: ${productName}\nStock actual: ${currentStock}\nStock mínimo: ${minStock}\n\nAcción requerida en PawSpa.`;

    return this.sendMessage(adminPhone, message);
  }

  /**
   * Get WhatsApp connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      hasQrCode: !!this.qrCode,
      qrCode: this.qrCode,
      messageCount: this.messageHistory.length
    };
  }

  /**
   * Get message history
   */
  getMessageHistory(limit = 50) {
    return this.messageHistory.slice(-limit).reverse();
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = null;
        this.isConnected = false;
        console.log('✅ WhatsApp client disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  }
}

// Create singleton instance
let whatsappInstance = null;

const getWhatsAppService = async () => {
  if (!whatsappInstance) {
    whatsappInstance = new WhatsAppService();
    try {
      await whatsappInstance.initialize();
    } catch (error) {
      console.error('Failed to initialize WhatsApp service:', error);
      // Continue running without WhatsApp if initialization fails
    }
  }
  return whatsappInstance;
};

module.exports = {
  WhatsAppService,
  getWhatsAppService,
  whatsappInstance: () => whatsappInstance
};
