import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentApi, accountApi } from '../api/client';

export default function AccountPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const opened = useRef(false);
  const playerId = params.get('id');
  const tempNo = params.get('tempNo');
  const fee = params.get('fee');

  useEffect(() => {
    if (opened.current || !playerId || !tempNo || !fee) return;
    opened.current = true;

    (async () => {
      try {
        const res = await paymentApi.getPayment({ id: playerId, tempNo, fee });
        const data = res.data;
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: data.razorpayKey,
            currency: 'INR',
            name: 'IMA Navli Navratri',
            description: `Registration Fee for IMA No: ${data.tempNo}`,
            order_id: data.orderId,
            handler(response) {
              paymentApi.verify({
                playerId: data.playerId,
                tempNo: data.tempNo,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                amount: data.amount,
              }).then((vr) => {
                if (vr.data.success) {
                  navigate('/account/success', { state: vr.data });
                } else {
                  navigate('/account/cancel', { state: { tempNo: data.tempNo, playerId: data.playerId } });
                }
              });
            },
            modal: {
              ondismiss() {
                accountApi.cancel({ playerId: data.playerId, tempNo: data.tempNo }).finally(() => {
                  navigate('/register');
                });
              },
            },
            prefill: { contact: data.contact || '' },
            theme: { color: '#3399cc' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } catch {
        navigate('/register');
      }
    })();
  }, [playerId, tempNo, fee, navigate]);

  return (
    <section className="section">
      <div className="container text-center">
        <p>Opening Razorpay payment...</p>
      </div>
    </section>
  );
}
