declare module "razorpay" {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    payment_capture?: number;
  }

  interface RazorpayInstance {
    orders: {
      create(options: OrderOptions): Promise<any>;
    };
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: OrderOptions): Promise<any>;
    };
  }

  export default Razorpay;
}
