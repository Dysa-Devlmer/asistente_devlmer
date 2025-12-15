/**
 * Service: Webpay
 *
 * Integración con Webpay Plus de Transbank
 *
 * NOTA: Esta es una implementación STUB/MOCK para desarrollo
 * En producción, usar SDK oficial de Transbank
 */

import { WebpayInitError, WebpayConfirmError, WebpayTimeoutError } from '../../../common/errors/typed-errors';

export interface WebpayInitResponse {
  token: string;
  url: string;
}

export interface WebpayConfirmResponse {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: {
    card_number: string;
  };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
}

/**
 * Servicio de integración con Webpay
 *
 * PRODUCCIÓN: Reemplazar con implementación real usando SDK de Transbank
 */
export class WebpayService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    // TODO: Cargar desde variables de entorno
    this.apiUrl = process.env.WEBPAY_API_URL || 'https://webpay3gint.transbank.cl';
    this.apiKey = process.env.WEBPAY_API_KEY || '597055555532';
    this.apiSecret = process.env.WEBPAY_API_SECRET || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
  }

  /**
   * Iniciar transacción Webpay
   *
   * @param buyOrder - Orden de compra (UUID del pago)
   * @param sessionId - ID de sesión
   * @param amount - Monto en pesos chilenos
   * @param returnUrl - URL de retorno después del pago
   */
  async initTransaction(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string
  ): Promise<WebpayInitResponse> {
    try {
      // STUB: En producción, hacer request real a Webpay API
      // const response = await fetch(`${this.apiUrl}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Tbk-Api-Key-Id': this.apiKey,
      //     'Tbk-Api-Key-Secret': this.apiSecret,
      //   },
      //   body: JSON.stringify({
      //     buy_order: buyOrder,
      //     session_id: sessionId,
      //     amount,
      //     return_url: returnUrl,
      //   }),
      // });

      // MOCK: Simular respuesta exitosa
      const mockToken = `${buyOrder.substring(0, 8)}-${Date.now()}`;
      const mockUrl = `${this.apiUrl}/webpayserver/initTransaction`;

      return {
        token: mockToken,
        url: mockUrl,
      };
    } catch (error: any) {
      throw new WebpayInitError(error.message);
    }
  }

  /**
   * Confirmar transacción Webpay
   *
   * @param token - Token de transacción
   */
  async confirmTransaction(token: string): Promise<WebpayConfirmResponse> {
    try {
      // STUB: En producción, hacer request real a Webpay API
      // const response = await fetch(`${this.apiUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Tbk-Api-Key-Id': this.apiKey,
      //     'Tbk-Api-Key-Secret': this.apiSecret,
      //   },
      // });

      // MOCK: Simular respuesta aprobada
      const mockResponse: WebpayConfirmResponse = {
        vci: 'TSY',
        amount: 15000,
        status: 'AUTHORIZED',
        buy_order: token.split('-')[0],
        session_id: 'mock-session',
        card_detail: {
          card_number: '6623',
        },
        accounting_date: new Date().toISOString().substring(0, 10).replace(/-/g, ''),
        transaction_date: new Date().toISOString(),
        authorization_code: Math.floor(1000 + Math.random() * 9000).toString(),
        payment_type_code: 'VN',
        response_code: 0, // 0 = aprobado
        installments_number: 0,
      };

      return mockResponse;
    } catch (error: any) {
      throw new WebpayConfirmError(error.message);
    }
  }

  /**
   * Reversar transacción Webpay
   *
   * @param token - Token de transacción
   * @param amount - Monto a reversar
   */
  async reverseTransaction(token: string, amount: number): Promise<boolean> {
    try {
      // STUB: En producción, hacer request real a Webpay API
      // const response = await fetch(`${this.apiUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}/refunds`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Tbk-Api-Key-Id': this.apiKey,
      //     'Tbk-Api-Key-Secret': this.apiSecret,
      //   },
      //   body: JSON.stringify({ amount }),
      // });

      // MOCK: Simular reversión exitosa
      return true;
    } catch (error: any) {
      throw new WebpayConfirmError(`Error al reversar: ${error.message}`);
    }
  }
}
