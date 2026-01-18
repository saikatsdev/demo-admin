import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";

const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchNotifications = async () => {
            try {
                const res = await getDatas("/admin/latest/orders");

                if (res?.success && mounted) {
                    const mapped = res.result.map(order => ({
                        id: order.id,
                        text: `${order.customer_name} placed an order`,
                        time: new Date(order.created_at).toLocaleTimeString(),
                        phone: order.phone_number,
                        amount: `${order.net_order_price} TK`,
                        image: order.details?.[0]?.product?.img_path || null
                    }));

                    setNotifications(mapped);
                }
            } catch (err) {
                if (mounted) setError(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchNotifications();

        return () => {
            mounted = false;
        };
    }, []);

    return { notifications, loading, error };
};

export default useNotifications;
