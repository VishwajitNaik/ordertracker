declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    order_id?: string;
    name?: string;
    description?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
  }

  export interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  export class RazorpayCheckout {
    static open(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentResponse>;
  }

  declare const _default: typeof RazorpayCheckout;
  export default _default;
}