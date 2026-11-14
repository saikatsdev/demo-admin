import { Alert, Collapse } from "antd";

const steps = [
    {
        key: "account",
        label: "1. Prepare the TikTok account",
        children: (
            <p>
                Use the profile whose DMs you want in Customer Inbox. TikTok requires an <b>Account with Advanced Access</b> or a <b>Verified Business Account</b>. For Advanced Access, link the profile to a TikTok for Business account or Business Center and confirm its eligibility.
            </p>
        ),
    },
    {
        key: "app",
        label: "2. Create an app and request messaging access",
        children: (
            <>
                <p>
                    Open the <b>Developer portal</b> below, register as a TikTok for Business developer, and create an app under <b>My Apps</b>.
                </p>

                <p>
                    Request <b>Business Messaging API</b> access for that app. Complete any data security and privacy review TikTok requests. Account eligibility and app approval are separate requirements.
                </p>
            </>
        ),
    },
    {
        key: "credentials",
        label: "3. Save the App ID and App Secret",
        children: (
            <p>
                Open your app in the TikTok developer portal and copy its <b>App ID</b> and <b>App Secret</b>. Paste them into <b>TikTok credentials</b> on this tab and click <b>Save settings</b>.
            </p>
        ),
    },
    {
        key: "environment",
        label: "4. Prepare your local or live API URL",
        children: (
            <>
                <p>
                    <b>Local.</b> Run Laravel and point a Cloudflare Tunnel to its local port. Save the tunnel’s public HTTPS API URL in <b>Admin → Settings → API URL</b>. A new Quick Tunnel gets a new hostname.
                </p>

                <p>
                    <b>Live.</b> Save your permanent HTTPS API URL in the live Admin’s <b>Settings → API URL</b>. Make sure TikTok can reach the live API over HTTPS.
                </p>
            </>
        ),
    },
    {
        key: "messaging",
        label: "5. Authorize the account and test DMs",
        children: (
            <>
                <p>
                    Once TikTok messaging is available in Customer Inbox, register the environment’s <b>OAuth Redirect URL</b> and <b>Webhook URL</b> with TikTok. Authorize the account and subscribe to the Business Messaging webhook events. If the tunnel hostname changes, update both URLs before testing again.
                </p>

                <p>
                    Send a DM from a second TikTok account, check <b>Customer Inbox → Inbox → TikTok</b>, then reply from Admin and confirm the message arrives in TikTok.
                </p>
            </>
        ),
    },
];

export default function TikTokSetupGuide() {
    return (
        <div className="cc-tiktok-guide">
            <Alert type="info" showIcon message="You can save credentials now. Account authorization, DM webhooks, and replies are pending." />
            <Collapse items={steps} defaultActiveKey={["account"]} expandIconPosition="end" />
        </div>
    );
}
