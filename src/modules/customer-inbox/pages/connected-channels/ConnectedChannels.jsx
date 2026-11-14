import { BookOutlined, CopyOutlined, DownOutlined, EyeInvisibleOutlined, EyeOutlined, FacebookOutlined, InstagramOutlined, KeyOutlined, LinkOutlined, MessageOutlined, PlayCircleOutlined, SafetyCertificateOutlined, SendOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, Row, Space, Tabs, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../../../hooks/useTitle";
import { usePermission } from "../../../../hooks/usePermission";
import { connectMessengerWithPageToken, getDeveloperApps, getDeveloperAppSecret, getMessengerSetup, saveDeveloperApp, saveMessengerSetup, startMessengerConnection } from "../../api/developerAppApi";
import { connectTelegramBot, getTelegramBots } from "../../api/telegramApi";
import WhatsAppManualConnect from "./WhatsAppManualConnect";
import WhatsAppProductionGuide from "./WhatsAppProductionGuide";
import TikTokSetupGuide from "./TikTokSetupGuide";
import TelegramSetupGuide from "./TelegramSetupGuide";
import "../../styles/connected-channels.css";

const { Title, Paragraph, Text } = Typography;
const metaDashboard              = "https://developers.facebook.com/apps/";
const metaVideo                  = "https://developers.meta.com/resources/videos/unified-onboarding-whatsapp/";

const channels = {
    messenger: {
        name     : "Messenger",
        icon     : <FacebookOutlined />,
        dashboard: metaDashboard,
        docs     : "https://developers.facebook.com/docs/messenger-platform/get-started/",
        video    : metaVideo,
    },
    whatsapp: {
        name     : "WhatsApp",
        icon     : <WhatsAppOutlined />,
        dashboard: metaDashboard,
        docs     : "https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api",
        video    : metaVideo,
    },
    instagram: {
        name     : "Instagram",
        icon     : <InstagramOutlined />,
        dashboard: metaDashboard,
        docs     : "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/",
        video    : metaVideo,
        steps    : [
            "Use an Instagram Professional account and configure Instagram Login in your Meta developer app.",
            "Check that your app can request instagram_business_manage_messages.",
            "Copy the app credentials from the Instagram setup section, then save them here.",
        ],
    },
    tiktok: {
        name     : "TikTok",
        icon     : <MessageOutlined />,
        dashboard: "https://business-api.tiktok.com/portal",
        docs     : "https://business-api.tiktok.com/portal/docs/business-messaging-api-get-started/v1.3",
    },
    telegram: {
        name: "Telegram",
        icon: <SendOutlined />,
        dashboard: "https://t.me/BotFather",
        docs: "https://core.telegram.org/bots/features#botfather",
    },
};

function TelegramBotSettings({ canConnect }) {
    const [form] = Form.useForm();
    const [bots, setBots] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        const request = new AbortController();
        getTelegramBots(request.signal)
            .then(({ data }) => {
                if (!request.signal.aborted) setBots(data.result);
            })
            .catch(() => {
                if (!request.signal.aborted) setLoadError(true);
            });
        return () => request.abort();
    }, []);

    const connect = async ({ bot_token }) => {
        setConnecting(true);
        setFeedback(null);
        try {
            const { data } = await connectTelegramBot(bot_token);
            const bot = data.result;
            setBots((existing) => [...(existing ?? []).filter(({ id }) => id !== bot.id), bot]);
            form.resetFields();
            setFeedback({ type: "success", message: `${bot.name} connected.` });
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to connect the Telegram bot." });
        } finally {
            setConnecting(false);
        }
    };

    return (
        <Card className="cc-card" title="Telegram bots" loading={!bots && !loadError}>
            <Space direction="vertical" style={{ display: "flex" }}>
                {loadError && <Alert type="error" message="Unable to load Telegram bots." showIcon />}
                {feedback && <Alert type={feedback.type} message={feedback.message} showIcon />}
                {bots?.length === 0 && <Text type="secondary">No Telegram bots connected</Text>}
                {bots?.map(({ id, name }) => <Tag key={id} color="blue">{name}</Tag>)}
                {canConnect && (
                    <Form form={form} layout="vertical" onFinish={connect} disabled={connecting}>
                        <Form.Item name="bot_token" label="Bot Token" rules={[{ required: true, max: 200 }]}>
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Button htmlType="submit" type="primary" icon={<SendOutlined />} loading={connecting}>Connect Telegram bot</Button>
                    </Form>
                )}
            </Space>
        </Card>
    );
}

function MessengerPageTokenForm({ disabled }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const connect = async ({ page_access_token }) => {
        setSubmitting(true);
        setFeedback(null);
        try {
            const { data } = await connectMessengerWithPageToken(page_access_token.trim());
            setFeedback({ type: "success", message: `${data.result.name} connected.` });
            form.resetFields();
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to connect the Facebook Page." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <details className="cc-page-token">
            <summary className="cc-page-token-toggle">
                <span className="cc-page-token-icon"><KeyOutlined aria-hidden="true" /></span>
                <span>Connect with Page Access Token</span>
                <DownOutlined className="cc-page-token-arrow" aria-hidden="true" />
            </summary>
            <Form className="cc-page-token-form" form={form} layout="vertical" onFinish={connect} disabled={disabled || submitting}>
                <ol className="cc-steps">
                    <li>Open the Meta app whose App ID is saved above.</li>
                    <li>In <strong>Messenger API Settings → Generate access tokens</strong>, find your Page and click <strong>Generate</strong>.</li>
                    <li>Paste the Page Access Token below and click <strong>Connect Page</strong>.</li>
                </ol>
                <Form.Item name="page_access_token" label="Page Access Token"
                    rules={[{ required: true, whitespace: true, max: 4096 }]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Space direction="vertical">
                    <Button htmlType="submit" type="primary" loading={submitting}>Connect Page</Button>
                    {feedback && <Alert type={feedback.type} message={feedback.message} showIcon />}
                </Space>
            </Form>
        </details>
    );
}

function MessengerWebhookSettings({ canUpdate }) {
    const [setup, setSetup] = useState(null);
    const [token, setToken] = useState("");
    const [tokenSaved, setTokenSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const copyUrl = async (url, label) => {
        try {
            await navigator.clipboard.writeText(url);
            setFeedback({ type: "success", message: `${label} copied.` });
        } catch {
            setFeedback({ type: "error", message: "Clipboard access is unavailable. Select and copy the URL manually." });
        }
    };

    useEffect(() => {
        const request = new AbortController();
        getMessengerSetup(request.signal).then(({ data }) => {
            if (!request.signal.aborted) setSetup(data.result);
        }).catch(() => {
            if (!request.signal.aborted) setFeedback({ type: "error", message: "Unable to load Messenger webhook settings." });
        });
        return () => request.abort();
    }, []);

    const generate = () => {
        const bytes = window.crypto.getRandomValues(new Uint8Array(32));
        setToken(Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""));
        setTokenSaved(false);
        setFeedback(null);
    };

    const save = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const { data } = await saveMessengerSetup(tokenSaved ? undefined : token);
            setSetup(data.result);
            setTokenSaved(Boolean(token));
            setFeedback({ type: "success", message: "Messenger settings saved to Laravel." });
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to save Messenger settings." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="cc-messenger-webhook-settings">
            {setup && (
                <>
                    <Text strong>API URL from Settings</Text>
                    <Text>{setup.api_url || "API URL is empty"}</Text>
                    {!setup.redirect_uri && <Alert type="warning" message="Set a public HTTPS API URL in Settings to generate both URLs." showIcon />}
                    <div className="cc-messenger-url">
                        <Text strong>OAuth Callback URL</Text>
                        <Text type="secondary">Paste into <b>Facebook Login settings → Valid OAuth Redirect URIs</b>.</Text>
                        {setup.redirect_uri
                            ? <Text code>{setup.redirect_uri}</Text>
                            : <Text type="secondary" code>/customer-inbox/messenger/callback</Text>}
                        <Button size="small" icon={<CopyOutlined />} disabled={!setup.redirect_uri}
                            aria-label="Copy OAuth Callback URL" onClick={() => copyUrl(setup.redirect_uri, "OAuth Callback URL")}
                        >
                            Copy URL
                        </Button>
                        {setup.redirect_uri && setup.saved_redirect_uri === setup.redirect_uri && <Tag color="green">Saved in Laravel</Tag>}
                    </div>
                    <div className="cc-messenger-url">
                        <Text strong>Messenger Webhook URL</Text>
                        <Text type="secondary">Paste into <b>Messenger API Settings → Configure webhooks → Callback URL</b>.</Text>
                        {setup.webhook_url
                            ? <Text code>{setup.webhook_url}</Text>
                            : <Text type="secondary" code>/customer-inbox/messenger/webhook</Text>}
                        <Button size="small" icon={<CopyOutlined />} disabled={!setup.webhook_url}
                            aria-label="Copy Messenger Webhook URL" onClick={() => copyUrl(setup.webhook_url, "Messenger Webhook URL")}
                        >
                            Copy URL
                        </Button>
                    </div>
                    {setup.has_verify_token && !token && <Text type="secondary">A verify token is already saved in Laravel .env.</Text>}
                </>
            )}
            {token && (
                <>
                    <Text strong>{tokenSaved ? "Saved verify token" : "New verify token · save to apply"}</Text>
                    <Text code copyable>{token}</Text>
                </>
            )}
            {setup && canUpdate && (
                <Space wrap>
                    <Button onClick={generate} disabled={saving}>Generate Verify Token</Button>
                    <Button type="primary" onClick={save} loading={saving} disabled={!setup.redirect_uri}>Save OAuth &amp; Webhook Settings</Button>
                </Space>
            )}
            {feedback && <Alert type={feedback.type} message={feedback.message} showIcon />}
        </div>
    );
}

function MessengerSetupSteps({ canUpdate }) {
    return (
        <ol className="cc-steps cc-messenger-steps">
            <li>
                <strong>Create your Meta app</strong>
                <p>In Meta App Dashboard, go to <b>My Apps → Create App</b>. Choose <b>Business messaging → Engage with customers on Messenger from Meta</b>. If prompted, select the Business Portfolio that owns your Facebook Page.</p>
            </li>
            <li>
                <strong>Save the App ID and App Secret</strong>
                <p>Open <b>App Settings → Basic</b>. Copy the <b>App ID</b>, then click <b>Show</b> next to <b>App Secret</b>. Enter both in the Messenger credentials form and click <b>Save settings</b>.</p>
            </li>
            <li>
                <strong>Copy your OAuth callback and webhook URLs</strong>
                <p>Both URLs use the API URL from Settings. <b>Save OAuth &amp; Webhook Settings</b> writes the OAuth callback to Laravel’s <code>CUSTOMER_INBOX_MESSENGER_REDIRECT_URI</code>.</p>
                <MessengerWebhookSettings canUpdate={canUpdate} />
            </li>
            <li>
                <strong>Verify the Messenger webhook</strong>
                <p>Click <b>Generate Verify Token</b> above, then save. Laravel writes it to <code>CUSTOMER_INBOX_MESSENGER_WEBHOOK_VERIFY_TOKEN</code>. If you already use a token, you can keep it by saving the URLs without generating a new one.</p>
                <p>Under <b>Configure webhooks</b>, paste the <b>Messenger Webhook URL</b> into <b>Callback URL</b> and the saved token into <b>Verify token</b>. Click <b>Verify and save</b>.</p>
            </li>
            <li>
                <strong>Connect the Page and test a message</strong>
                <p>Click <b>Connect Facebook Page</b> and grant access to the Page. If the Page picker is empty, open <b>Connect with Page Access Token</b> and follow its instructions.</p>
                <p>In Meta’s <b>Messenger API Settings</b>, find your Page and use <b>Add Subscriptions</b> to enable <code>messages</code>. In development mode, send a new message from a personal profile with an active app role and check <b>Customer Inbox → Inbox</b>.</p>
            </li>
        </ol>
    );
}

function ChannelGuide({ channel, platform, canUpdate }) {
    const isWhatsApp = platform === "whatsapp";

    return (
        <Card className="cc-card" title={<Space><BookOutlined />{isWhatsApp ? "WhatsApp production setup" : `${channel.name} setup guide`}</Space>}>
            {platform === "messenger" && <MessengerSetupSteps canUpdate={canUpdate} />}
            {isWhatsApp && <WhatsAppProductionGuide />}
            {platform === "tiktok" && <TikTokSetupGuide />}
            {platform === "telegram" && <TelegramSetupGuide />}
            {channel.steps && (
                <ol className="cc-steps">
                    {channel.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
            )}

            <Space wrap>
                <Button href={channel.dashboard} target="_blank" rel="noopener noreferrer" icon={<LinkOutlined />}>
                    Developer portal
                </Button>

                <Button href={channel.docs} target="_blank" rel="noopener noreferrer" icon={<BookOutlined />}>
                    Read guide
                </Button>

                {channel.video && (
                    <Button href={channel.video} target="_blank" rel="noopener noreferrer" icon={<PlayCircleOutlined />}>
                        Watch Meta walkthrough
                    </Button>
                )}
            </Space>
        </Card>
    );
}

function DeveloperAppForm({ platform, app, canUpdate, saving, onSave }) {
    const [form]                                = Form.useForm();
    const [replacingSecret, setReplacingSecret] = useState(false);
    const [secret, setSecret]                   = useState(null);
    const [revealing, setRevealing]             = useState(false);
    const [secretError, setSecretError]         = useState("");
    const showSavedSecret                       = Boolean(app) && !replacingSecret;

    const toggleSecret = async () => {
        if (secret !== null) {
            setSecret(null);
            return;
        }

        setRevealing(true);

        setSecretError("");

        try {
            const response = await getDeveloperAppSecret(platform);

            if (!response?.success || typeof response.result?.app_secret !== "string") {
                throw new Error();
            }

            setSecret(response.result.app_secret);
        } catch {
            setSecretError("Unable to show the saved App Secret.");
        } finally {
            setRevealing(false);
        }
    };

    const submit = async (values) => {
        if (await onSave(values)) {
            form.resetFields(["app_secret"]);
            setReplacingSecret(false);
        }
    };

    return (
        <Form form={form} layout="vertical" initialValues={{ app_id: app?.app_id, configuration_id: app?.configuration_id }} onFinish={submit} disabled={!canUpdate || saving}>
            <Form.Item name="app_id" label={platform === "tiktok" ? "App ID (App Key)" : "App ID"} rules={[{ required: true, max: 255 }]}>
                <Input />
            </Form.Item>

            {showSavedSecret ? (
                <Form.Item label="App Secret" help={secretError} validateStatus={secretError ? "error" : undefined}>
                    <Input value={secret ?? "••••••••"} readOnly aria-label="Saved App Secret"
                        suffix={canUpdate && (
                            <Button type="text" size="small" loading={revealing} icon={secret === null ? <EyeOutlined /> : <EyeInvisibleOutlined />} aria-label={secret === null ? "Show App Secret" : "Hide App Secret"} onClick={toggleSecret}/>
                        )}
                    />
                    {canUpdate && 
                        <Button type="link" disabled={revealing} onClick={() => {
                            setSecret(null);
                            setSecretError("");
                            setReplacingSecret(true);
                        }}>
                            Change App Secret
                        </Button>
                    }
                </Form.Item>
            ) : (
                <Form.Item name="app_secret" label="App Secret" rules={[{ required: true, max: 1024 }]}>
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
            )}

            {platform === "whatsapp" && (
                <Form.Item name="configuration_id" label="Embedded Signup Configuration ID (optional)" rules={[{ max: 255 }]}>
                    <Input />
                </Form.Item>
            )}

            {canUpdate && 
                <Button htmlType="submit" type="primary" loading={saving} disabled={showSavedSecret}>
                    Save settings
                </Button>
            }
        </Form>
    );
}

export default function ConnectedChannels() {
    useTitle("Connected Channels | Customer Inbox");

    const { can }                     = usePermission();
    const canRead                     = can("customer-inbox-channels-read");
    const canUpdate                   = can("customer-inbox-channels-update");
    const canConnect                  = can("customer-inbox-channels-create");
    const [platform, setPlatform]     = useState("messenger");
    const [apps, setApps]             = useState(null);
    const [error, setError]           = useState("");
    const [notice, setNotice]         = useState("");
    const [saving, setSaving]         = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        if (!canRead) return;

        let active = true;

        getDeveloperApps().then((response) => {
            if (!active){
                return;
            }

            if (response?.success) {
                setApps(response.result);
            }else{
                 setError("Unable to load developer apps.");
            }

        }).catch(() => {
            if (active) {
                setError("Unable to load developer apps.");
            }
        });
        return () => { active = false; };
    }, [canRead]);

    const app = apps?.find((entry) => entry.platform === platform);

    const connectMessenger = async () => {
        setConnecting(true);

        setError("");

        setNotice("");

        try {
            const response = await startMessengerConnection();
            if (!response?.success || !response.result?.url) {
                throw new Error();
            }

            window.location.assign(response.result.url);
        } catch {
            setError("Unable to start Facebook authorization.");
        } finally {
            setConnecting(false);
        }
    };

    const save = async (values) => {
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const response = await saveDeveloperApp(platform, values);

            if (!response?.success) {
                throw new Error();
            }
            const { app_id, configuration_id } = values;

            setApps((previous) => [
                ...previous.filter((entry) => entry.platform !== platform),
                { platform, app_id, configuration_id },
            ]);

            setNotice("Developer app settings saved.");

            return true;
        } catch {
            setError("Unable to save developer app settings.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    if (!canRead) return <Alert type="error" message="You do not have permission to view channel settings." />;

    const channel = channels[platform];

    return (
        <Space className="cc-page" direction="vertical" size="large">
            <header className="cc-heading">
                <div>
                    <Text className="cc-eyebrow">Customer Inbox</Text>
                    <Title level={2}>Connected Channels</Title>
                    <Text>Configure your own developer app for each messaging channel.</Text>
                </div>
                
                <span className="cc-security"><SafetyCertificateOutlined /> Encrypted credentials</span>
            </header>

            {error && <Alert type="error" message={error} showIcon />}

            {notice && <Alert type="success" message={notice} showIcon />}

            <Tabs className="cc-tabs" activeKey={platform} items={Object.entries(channels).map(([key, item]) => ({
                key,
                label: (
                    <span className={`cc-tab cc-tab--${key}`}>
                        <span className="cc-tab-icon" aria-hidden="true">{item.icon}</span>
                        <span>
                            <span className="cc-tab-name">{item.name}</span>
                            {apps && key !== "telegram" && (
                                <span className="cc-tab-status">
                                    {apps.some((entry) => entry.platform === key) ? "Credentials saved" : "Setup needed"}
                                </span>
                            )}
                        </span>
                    </span>
                ),
                disabled: saving || connecting,
            }))} onChange={(value) => {
                setPlatform(value);
                setNotice("");
                if (apps) setError("");
            }} />

            <Row gutter={[20, 20]} align="top">
                <Col xs={24} lg={13}>
                    {platform === "telegram" ? <TelegramBotSettings canConnect={canConnect} /> : (
                    <Card className="cc-card" title={`${channel.name} credentials`} loading={!apps && !error} extra={apps && <Tag color={app ? "green" : "default"}>{app ? "Credentials saved" : "Setup needed"}</Tag>}>
                        {apps && (
                            <>
                                <Paragraph type="secondary">
                                    Use the credentials from your developer dashboard. Account authorization is a separate step.
                                </Paragraph>

                                <DeveloperAppForm key={platform} platform={platform} app={app} canUpdate={canUpdate} saving={saving || connecting} onSave={save}/>

                                {platform === "messenger" && app && canConnect && (
                                    <>
                                        <Button type="primary" size="medium" className="cc-facebook-connect" icon={<FacebookOutlined />} loading={connecting} disabled={saving} onClick={connectMessenger}>
                                            Connect Facebook Page
                                        </Button>
                                        <Paragraph className="cc-connect-help" type="secondary">
                                            Try Connect Facebook Page first. If your Page is missing or you see “No eligible Pages found,” use the Page Access Token option below.
                                        </Paragraph>
                                        <MessengerPageTokenForm disabled={saving || connecting} />
                                    </>
                                )}
                            </>
                        )}
                    </Card>
                    )}
                    {platform === "whatsapp" && app && canConnect && (
                        <div style={{ marginTop: 20 }}>
                            <WhatsAppManualConnect key={`${app.app_id}-${saving}`} disabled={saving} />
                        </div>
                    )}
                </Col>
                
                <Col xs={24} lg={11}>
                    <ChannelGuide channel={channel} platform={platform} canUpdate={canUpdate} />
                </Col>
            </Row>
        </Space>
    );
}
