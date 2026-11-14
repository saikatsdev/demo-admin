import { EditOutlined, EnterOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Form, Input, Modal, Space, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { createQuickReply, getQuickReplies, updateQuickReply } from "../../api/inboxApi";

export default function QuickReplyPicker({ canRead, canCreate, canUpdate, canInsert, initialBody, onInsert, onClose }) {
    const [replies, setReplies]   = useState(null);
    const [search, setSearch]     = useState("");
    const [editing, setEditing]   = useState(!canRead);
    const [template, setTemplate] = useState(null);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState("");

    useEffect(() => {
        if (!canRead) return;
        const controller = new AbortController();
        getQuickReplies(controller.signal).then(({ data }) => {
            if (!controller.signal.aborted) setReplies(data.result);
        }).catch(() => {
            if (!controller.signal.aborted) {
                setError("Unable to load quick replies.");
                setReplies([]);
            }
        });
        return () => controller.abort();
    }, [canRead]);

    const save = async ({ title, body }) => {
        if (saving || (template ? !canUpdate : !canCreate)) return;
        setSaving(true);
        setError("");
        try {
            const values = { 
                title: title.trim(), 
                body: body.trim() 
            };

            const { data } = template ? await updateQuickReply(template.id, values) : await createQuickReply(values);

            setReplies((current) => [...(current ?? []).filter(({ id }) => id !== data.result.id), data.result].sort((a, b) => a.title.localeCompare(b.title) || a.id - b.id));

            setSearch("");

            setTemplate(null);

            if (canRead) {
                setEditing(false);
            }else{
                onClose();
            }
        } catch (failure) {
            setError(failure.response?.data?.message || "Unable to save the quick reply.");
        } finally {
            setSaving(false);
        }
    };

    const query   = search.trim().toLowerCase();
    const matches = replies?.filter(({ title, body }) => title.toLowerCase().includes(query) || body.toLowerCase().includes(query));

    return (
        <Modal open centered width={520} title="Quick Replies" footer={null} onCancel={onClose}
            closable={!saving} keyboard={!saving} maskClosable={!saving}>
            <div className="ci-quick-replies">
                {error && <Alert type="error" showIcon message={error} />}
                {editing && (template ? canUpdate : canCreate) ? (
                    <Form key={template?.id ?? "new"} layout="vertical" initialValues={template ?? { body: initialBody }} onFinish={save} disabled={saving}>
                        <Form.Item name="title" label="Template name" rules={[{ required: true, whitespace: true, max: 255 }]}>
                            <Input maxLength={255} />
                        </Form.Item>

                        <Form.Item name="body" label="Message" rules={[{ required: true, whitespace: true, max: 2000 }]}>
                            <Input.TextArea rows={4} maxLength={2000} showCount />
                        </Form.Item>

                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>{template ? "Save changes" : "Save quick reply"}</Button>
                            {canRead && <Button htmlType="button" onClick={() => { setError(""); setTemplate(null); setEditing(false); }}>Back to templates</Button>}
                        </Space>
                    </Form>
                ) : (
                    <>
                        <div className="ci-group-controls">
                            <Input aria-label="Search quick replies" placeholder="Search quick replies" allowClear value={search}
                                onChange={(event) => setSearch(event.target.value)} />
                            {canCreate && <Button type="primary" disabled={!replies} onClick={() => { setError(""); setEditing(true); }}>Create</Button>}
                        </div>

                        {!replies && <Spin size="small" />}
                        {matches?.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={query ? "No matching replies" : "No quick replies yet"} />}
                        {matches?.length > 0 && (
                            <div className="ci-quick-reply-list">
                                {matches.map(({ id, title, body }) => (
                                    <div className="ci-metadata-manage-row" key={id}>
                                        <div className="ci-quick-reply-copy">
                                            <Typography.Text strong>{title}</Typography.Text>
                                            <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>{body}</Typography.Paragraph>
                                        </div>

                                        <Space size={6}>
                                            {canUpdate && <Button icon={<EditOutlined />} title="Edit template" aria-label={`Edit ${title}`} onClick={() => {
                                                setError("");
                                                setTemplate({ id, title, body });
                                                setEditing(true);
                                            }} />}
                                            
                                            <Button icon={<EnterOutlined />} title="Insert into reply" aria-label={`Insert ${title} into reply`} disabled={!canInsert} onClick={() => {
                                                const problem = onInsert(body);
                                                if (problem) setError(problem);
                                            }} />
                                        </Space>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
