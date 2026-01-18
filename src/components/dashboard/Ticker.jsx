import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

export default function Ticker() {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tickerText, setTickerText] = useState([]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await axios.get(
          "https://portalapi.servicekey.com.bd/api/bulletins/list"
        );

        setTickerText(res?.data?.result || []);
      } catch (error) {
        console.error("Ticker fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicker();
  }, []);

  if (loading) return <div className="ticker-loading">Loading...</div>;

  if (!visible) return null;

  return (
    <div className="ticker-wrapper">
      <button className="close-btn" onClick={() => setVisible(false)}>
        <X size={18} />
      </button>

      <div className="ticker">
        <div className="ticker">
          {tickerText.length > 0
            ? tickerText.map((item) => (
                <p key={item.id}>
                  {item.title}
                </p>
              ))
            : "No bulletins available"}
        </div>
      </div>
    </div>
  );
}
