import { DownOutlined } from "@ant-design/icons";

const steps = [
    {
        title: "Deploy the Laravel API and Admin",
        content: (
            <>
                <p>
                    Deploy both projects with the Customer Inbox module enabled. Point the API domain’s document root to Laravel’s <code>public</code> directory, enable HTTPS and apply any pending database migrations. Preserve the existing Laravel <code>APP_KEY</code> if you move a database with saved credentials.
                </p>

                <p>
                    Set the Admin build’s <code>VITE_API_BASE_URL</code> to your live API URL ending in <code>/api</code>, then rebuild and deploy the Admin. If the domains differ, allow the Admin origin in the API’s CORS configuration.
                </p>

                <p>
                    In <b>Admin → Settings → API URL</b>, save the live HTTPS API URL. The WhatsApp webhook URL is generated from this setting and ends in <code>/customer-inbox/whatsapp/webhook</code>.
                </p>
                <p>
                    For real-time Inbox updates, set <code>PUSHER_APP_ID</code>, <code>PUSHER_APP_KEY</code>, <code>PUSHER_APP_SECRET</code> and <code>PUSHER_APP_CLUSTER</code> in Laravel. Set the matching <code>VITE_PUSHER_APP_KEY</code> and <code>VITE_PUSHER_APP_CLUSTER</code> before building the Admin.
                </p>
            </>
        ),
    },
    {
        title: "Prepare the Meta app and business number",
        content: (
            <>
                <p>
                    In <b>Meta App Dashboard → Use cases</b>, add or open <b>Connect with customers through WhatsApp</b>. Use the Business Portfolio that owns the WhatsApp Business Account (WABA).
                </p>

                <p>
                    Open <b>Basic setup → Step 2. Production setup → Register your WhatsApp phone number</b>. Add and verify the business number customers will message. In <b>WhatsApp Manager</b>, copy its <b>Phone Number ID</b> and the owning <b>WhatsApp Business Account ID</b>.
                </p>

                <p>
                    In Meta’s <b>Publish</b> section, complete the requirements shown for your app, including business verification or permission review if Meta requests them. Publish the app before testing live customer traffic.
                </p>
            </>
        ),
    },
    {
        title: "Save credentials and generate a production token",
        content: (
            <>
                <p>
                    Copy the <b>App ID</b> and <b>App Secret</b> from <b>Meta App Dashboard → App settings → Basic</b> and save them in this tab. You can leave <b>Embedded Signup Configuration ID</b> blank for Manual Connect.
                </p>

                <p>
                    In <b>Meta Business Settings → Users → System users</b>, create or select a system user, assign the Meta app and the WhatsApp Business Account, then choose <b>Generate new token</b> for that app. Include <code>whatsapp_business_management</code> and <code>whatsapp_business_messaging</code>.
                </p>
                <p>
                    Use this system user token for production. When renewing or rotating it, reconnect the same Phone Number ID in Manual Connect with the new token.
                </p>
            </>
        ),
    },
    {
        title: "Verify the live webhook",
        content: (
            <>
                <p>
                    Copy <b>Webhook Callback URL</b> and <b>Webhook Verify Token</b> from <b>WhatsApp Manual Connect</b>. Open <b>Meta App Dashboard → WhatsApp use case → Step 2. Production setup → Configure Webhooks</b>.
                </p>

                <p>
                    Paste the two values into <b>Callback URL</b> and <b>Verify token</b>. Click <b>Verify and save</b>, reopen <b>Configure Webhooks</b>, then subscribe to <code>messages</code> under <b>Webhook fields</b>.
                </p>

                <p>
                    Admin provides both values for this step. Repeat verification if the live API domain or Meta app credentials change.
                </p>
            </>
        ),
    },
    {
        title: "Connect the live number in Admin",
        content: (
            <>
                <dl className="cc-whatsapp-fields">
                    <dt>Phone Number ID</dt>
                    <dd>The numeric ID of the live business number in WhatsApp Manager.</dd>
                    <dt>Messaging account ID (WABA ID)</dt>
                    <dd>The ID of the WhatsApp Business Account that owns that number.</dd>
                    <dt>WhatsApp Access Token</dt>
                    <dd>The system user token generated for the Meta app saved in this tab.</dd>
                </dl>
                <p>Click <b>Connect WhatsApp</b>. Customer Inbox checks that the phone belongs to the WABA and subscribes the Meta app to that WABA.</p>
            </>
        ),
    },
    {
        title: "Test incoming messages and replies",
        content: (
            <>
                <p>
                    From another WhatsApp account, send a message to the live business number. Open <b>Customer Inbox → Inbox → WhatsApp</b>, confirm it appears, then send a text reply and confirm it arrives on the other phone.
                </p>

                <p>
                    Send free-form text replies within 24 hours of the customer’s last message. If the window closes, the customer can reopen it by sending a new message.
                </p>

                <p>
                    If messages are missing, check the app’s published status, the live callback URL, the <code>messages</code> subscription and the connected Phone Number ID. If replies fail, check the token and its <code>whatsapp_business_messaging</code> permission.
                </p>
            </>
        ),
    },
];

export default function WhatsAppProductionGuide() {
    return (
        <ol className="cc-whatsapp-steps">
            {steps.map(({ title, content }, index) => (
                <li key={title}>
                    <details>
                        <summary>
                            <span className="cc-whatsapp-step-number" aria-hidden="true">{index + 1}</span>
                            <span>{title}</span>
                            <DownOutlined className="cc-whatsapp-step-arrow" aria-hidden="true" />
                        </summary>
                        <div className="cc-whatsapp-step-body">{content}</div>
                    </details>
                </li>
            ))}
        </ol>
    );
}
