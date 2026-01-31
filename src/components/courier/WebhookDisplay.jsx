import { useState } from "react";
import "./WebhookDisplay.css";

const WebhookDisplay = ({ settings, service }) => {
    const [copied, setCopied] = useState(false);

     const fullUrl = `${settings.api_url}/api/admin/${service}/callback`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="webhook-card">
            <h4>Webhook URL:</h4>
            <div className="webhook-url-container">
                <span>{fullUrl}</span>
                <button onClick={handleCopy} className={`copy-btn ${copied ? "copied" : ""}`}>
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
    );
};

export default WebhookDisplay;
