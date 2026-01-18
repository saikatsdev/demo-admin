import { Alert } from "antd";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";
import "./notify.css";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  forceTLS: true,
});

export default function NotificationWrapper({ children }) {
  // State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    echo.channel("orders").listen(".order.placed", (event) => {
      const order = event.order;

      // Build descriptive message
      const customerName = order.customer_name;
      const invoice = order.invoice_number;
      const phone = order.phone_number;
      const products = order.details
        .map(
          (item) =>
            `${item.product.name} (Qty: ${item.quantity}, Price: ${item.sell_price})`
        )
        .join(", ");

      const message = (
        <>
          <p>
            <strong>Customer:</strong> {customerName}
          </p>
          <p>
            <strong>Invoice:</strong> {invoice}
          </p>
          <p>
            <strong>Phone:</strong> {phone}
          </p>
          <p>
            <strong>Products:</strong> {products}
          </p>
        </>
      );

      setAlertMessage(message);
      setShowAlert(true);

      setTimeout(() => setShowAlert(false), 60000);

      const audio = new Audio("/sounds/notification.mp3");
      audio.play().catch(() => {});
    });

    return () => {
      echo.leaveChannel("orders");
    };
  }, []);

  return (
    <>
      {showAlert && (
        <Alert
          message="New Order!"
          description={alertMessage}
          type="success"
          closable
          onClose={() => setShowAlert(false)}
          className="notify"
        />
      )}

      {children}
    </>
  );
}
