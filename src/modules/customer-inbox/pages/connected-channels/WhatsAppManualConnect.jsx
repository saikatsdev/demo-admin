import { WhatsAppOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import api from "../../../../api";

const endpoint = "/admin/customer-inbox/whatsapp";
const { Text } = Typography;
const idRules = [{ required: true, pattern: /^\d{1,32}$/, message: "Enter the numeric ID shown in Meta." }];

export default function WhatsAppManualConnect({ disabled }) {
    const [form] = Form.useForm();
    const [setup, setSetup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const request = new AbortController();
        api.get(`${endpoint}/setup`, { signal: request.signal }).then(({ data }) => {
            if (!request.signal.aborted) setSetup(data.result);
        }).catch(() => {
            if (!request.signal.aborted) setFeedback({ type: "error", message: "Unable to load WhatsApp setup. Reload the page to try again." });
        }).finally(() => {
            if (!request.signal.aborted) setLoading(false);
        });
        return () => request.abort();
    }, []);

    const connect = async (values) => {
        setConnecting(true);
        setFeedback(null);
        try {
            const { data } = await api.post(`${endpoint}/connect`, values);
            const account = data.result;
            setSetup((current) => ({
                ...current,
                accounts: [...current.accounts.filter(({ id }) => id !== account.id), account],
            }));
            form.resetFields();
            setFeedback({ type: "success", message: `${account.name} connected to Customer Inbox.` });
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to connect WhatsApp." });
        } finally {
            setConnecting(false);
        }
    };

    return (
        <Card className="cc-card" title="WhatsApp Manual Connect" loading={loading}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {feedback && <Alert showIcon {...feedback} />}
                {setup?.accounts.map((account) => <Tag color="green" key={account.id}>{account.name}</Tag>)}
                {setup && (
                    <>
                        <Text>In your Meta app, open the WhatsApp webhook settings. Paste these two values, click <strong>Verify and save</strong>, then subscribe to the <Text code>messages</Text> field.</Text>
                        {setup.webhook_url ? (
                            <div className="cc-messenger-url">
                                <Text strong>Webhook Callback URL</Text>
                                <Text copyable code>{setup.webhook_url}</Text>
                            </div>
                        ) : <Alert type="warning" showIcon message="Set a public HTTPS API URL in Settings, then reopen the WhatsApp tab." />}

                        <div className="cc-messenger-url">
                            <Text strong>Webhook Verify Token</Text>
                            <Input.Password readOnly value={setup.verify_token ?? ""} aria-label="Webhook Verify Token" autoComplete="off" />
                            {setup.verify_token && <Text copyable={{ text: setup.verify_token }}>Copy verify token</Text>}
                        </div>

                        <Text>
                            For a live number, use the IDs from <strong>WhatsApp Manager</strong> and a <strong>system user access token</strong>. For a test number, use the IDs and token from Meta’s <strong>Step 1. Try it out</strong>.
                        </Text>

                        <Form form={form} layout="vertical" onFinish={connect} disabled={disabled || connecting || !setup.webhook_url || !setup.verify_token}>
                            <Form.Item name="phone_number_id" label="Phone Number ID" rules={idRules}>
                                <Input inputMode="numeric" />
                            </Form.Item>

                            <Form.Item name="waba_id" label="Messaging account ID (WABA ID)" rules={idRules}>
                                <Input inputMode="numeric" />
                            </Form.Item>

                            <Form.Item name="access_token" label="WhatsApp Access Token" rules={[{ required: true, max: 4096, whitespace: true }]}>
                                <Input.Password autoComplete="off" />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" icon={<WhatsAppOutlined />} loading={connecting}>
                                Connect WhatsApp
                            </Button>
                        </Form>
                    </>
                )}
            </Space>
        </Card>
    );
}
