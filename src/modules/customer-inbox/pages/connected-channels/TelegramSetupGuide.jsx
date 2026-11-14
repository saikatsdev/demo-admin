import { Collapse, Typography } from "antd";
import { useAppSettings } from "../../../../contexts/useAppSettings";

const localCommand = "cloudflared tunnel --url http://127.0.0.1:8000";
const localSetting = "CUSTOMER_INBOX_TELEGRAM_WEBHOOK_BASE_URL=https://YOUR-TUNNEL.trycloudflare.com";
const liveFallback = "https://api.yourdomain.com";

function getWebhookBase(value) {
    if (typeof value !== "string") return null;

    try {
        const url = new URL(value.trim());
        if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;

        return url.origin + url.pathname.replace(/\/+$/, "").replace(/\/api$/i, "");
    } catch {
        return null;
    }
}

function CopyCommand({ value }) {
    return <Typography.Paragraph className="cc-telegram-command" code copyable={{ text: value }}>{value}</Typography.Paragraph>;
}

const setupSteps = (apiBase) => [
    {
        key: "bot",
        label: "1. Create a bot and copy its token",
        children: (
            <>
                <p>
                    Open <b>@BotFather</b> in Telegram, tap <b>Start</b>, then send <code>/newbot</code>.
                </p>

                <p>
                    Enter a display name and choose a unique username ending in <code>bot</code>. Copy the <b>Bot Token</b> BotFather sends and keep it private.
                </p>
            </>
        ),
    },
    {
        key: "local",
        label: "2. Set the webhook URL for local testing",
        children: (
            <>
                <p>
                    Start Laravel locally, then run this in a separate terminal if Laravel listens on port 8000.
                </p>

                <CopyCommand value={localCommand} />

                <p>
                    Replace the example hostname with the HTTPS URL Cloudflare prints and save the setting in Laravel’s <code>.env</code>.
                </p>

                <CopyCommand value={localSetting} />

                <p>
                    Run <code>php artisan config:clear</code> from the Laravel project folder. Keep Laravel and the tunnel running while you test. If a new tunnel changes the hostname, update the setting, clear the cache, and reconnect the bot here.
                </p>
            </>
        ),
    },
    {
        key: "live",
        label: "3. Set the webhook URL for a live server",
        children: (
            <>
                <p>
                    When deploying to a live server, use its permanent public HTTPS API domain in Laravel’s <code>.env</code>. Enter the base URL without <code>/api</code> or the webhook path.
                </p>

                <p>
                    {apiBase ? "The example below uses the API URL from Settings." : "Replace the example domain with your live HTTPS API domain."}
                </p>

                <CopyCommand value={`CUSTOMER_INBOX_TELEGRAM_WEBHOOK_BASE_URL=${apiBase ?? liveFallback}`} />

                <p>
                    Run <code>php artisan config:clear</code> on the live server, then connect from the live Admin. Telegram keeps one webhook per bot, so use a dedicated test bot if local and live need to receive messages at the same time.
                </p>
            </>
        ),
    },
    {
        key: "connect",
        label: "4. Connect the bot in Admin",
        children: (
            <>
                <p>
                    Paste the token into <b>Bot Token</b> on this tab, then click <b>Connect Telegram bot</b>. Customer Inbox verifies the token and registers the webhook automatically.
                </p>

                <p>
                    If Admin says the bot already has a webhook, check which service uses it. Use a dedicated bot, or remove the old webhook when you are ready to move that bot to this installation.
                </p>
            </>
        ),
    },
    {
        key: "test",
        label: "5. Test incoming messages and replies",
        children: (
            <>
                <p>
                    Open your bot’s private chat from a Telegram account, tap <b>Start</b>, and send a test message. Go to <b>Customer Inbox → Inbox → Telegram</b> to check that it arrived.
                </p>

                <p>
                    Start writing a reply in Admin and check for <b>typing…</b> in Telegram. Send the reply and confirm it appears in the same chat.
                </p>

                <p>
                    If no message arrives, confirm the HTTPS endpoint is reachable and the bot was connected after the most recent webhook URL change.
                </p>
            </>
        ),
    },
];

export default function TelegramSetupGuide() {
    const { settings } = useAppSettings();
    const apiBase      = getWebhookBase(settings?.api_url);

    return (
        <div className="cc-telegram-guide">
            <Collapse items={setupSteps(apiBase)} defaultActiveKey={["bot"]} expandIconPosition="end" />
        </div>
    );
}
