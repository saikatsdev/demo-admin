import { CheckOutlined, FlagOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Select, Space, Spin, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../../../api/common/common";
import { usePermission } from "../../../../hooks/usePermission";
import ManageMetadataOptions from "./ManageMetadataOptions";
import { createConversationLabel, createConversationMetadataOption, getConversationMetadata, getConversationMetadataOptions, saveConversationMetadata } from "../../api/inboxApi";

const fields = [
    { name: "lead_stage_id", label: "Lead Stage", options: "lead_stages", type: "lead-stages", icon: FlagOutlined, example: "Qualified" },
    { name: "order_status_id", label: "Order Status", options: "order_statuses", type: "order-statuses", icon: ShoppingCartOutlined, example: "Delivered" },
];
const labelField = { name: "label_ids", label: "Labels", options: "labels", type: "labels" };
const workflowFields = [
    { name: "status", label: "Status", values: ["open", "pending", "resolved"] },
    { name: "priority", label: "Priority", values: ["low", "normal", "high", "urgent"] },
];
const displayValue = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";

export default function ConversationMetadata({ conversationId }) {
    const { can }                             = usePermission();
    const canEdit                             = can("customer-inbox-update");
    const canReadLabels                       = can("customer-inbox-tags-read");
    const canEditLabels                       = canEdit && canReadLabels && can("customer-inbox-tags-update");
    const canCreateLabel                      = canEditLabels && can("customer-inbox-tags-create");
    const canDeleteLabel                      = canEdit && canReadLabels && can("customer-inbox-tags-delete");
    const [form]                              = Form.useForm();
    const [metadata, setMetadata]             = useState(null);
    const [options, setOptions]               = useState(null);
    const [users, setUsers]                   = useState(null);
    const [usersError, setUsersError]         = useState(false);
    const [feedback, setFeedback]             = useState(null);
    const [saving, setSaving]                 = useState(false);
    const [addingLabel, setAddingLabel]       = useState(false);
    const [labelName, setLabelName]           = useState("");
    const [newOption, setNewOption]           = useState(null);
    const [creatingOption, setCreatingOption] = useState(false);
    const [managing, setManaging]             = useState(null);

    useEffect(() => {
        const request = new AbortController();
        Promise.all([
            getConversationMetadata(conversationId, request.signal),
            getConversationMetadataOptions(request.signal),
        ]).then(([details, choices]) => {
            if (request.signal.aborted) return;
            const value = details.data.result;
            form.setFieldsValue({ ...value, label_ids: value.labels.map(({ id }) => id) });
            setMetadata(value);
            setOptions(choices.data.result);
        }).catch(() => {
            if (!request.signal.aborted) setFeedback({ type: "error", message: "Unable to load conversation fields." });
        });
        return () => request.abort();
    }, [conversationId, form]);

    useEffect(() => {
        if (!canEdit) return;
        let active = true;

        const loadUsers = async () => {
            const allUsers = new Map();
            let page = 1;
            let lastPage = 1;
            do {
                const response = page === 1 ? await getDatas("/admin/users/list") : await getDatas("/admin/users/list", { page });
                if (!active) return;
                if (!response?.success || !Array.isArray(response.result?.data)) {
                    setUsersError(true);
                    return;
                }
                for (const { id, username } of response.result.data) allUsers.set(id, username);
                lastPage = response.result.meta?.last_page ?? 1;
                page += 1;
            } while (page <= lastPage);
            setUsers(allUsers);
        };

        void loadUsers();
        return () => { active = false; };
    }, [canEdit]);

    const save = async (values) => {
        setSaving(true);
        setFeedback(null);
        try {
            const payload = Object.fromEntries(fields.map(({ name }) => [name, values[name] ?? null]));
            for (const { name } of workflowFields) {
                if (values[name] !== metadata[name]) payload[name] = values[name];
            }

            if ((values.assigned_to ?? null) !== metadata.assigned_to) {
                payload.assigned_to = values.assigned_to ?? null;
            }

            if (canEditLabels) {
                payload.label_ids = values.label_ids ?? [];
            }

            const { data } = await saveConversationMetadata(conversationId, payload);

            const saved = data.result;

            setMetadata(saved);

            form.setFieldsValue({ ...saved, label_ids: saved.labels.map(({ id }) => id) });

            setFeedback({ type: "success", message: "Conversation fields saved." });
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to save conversation fields." });
        } finally {
            setSaving(false);
        }
    };

    const addOption = async () => {
        const name = newOption?.value.trim();
        if (!name || creatingOption) return;

        setCreatingOption(true);
        setNewOption((current) => ({ ...current, error: "" }));
        try {
            const { data } = await createConversationMetadataOption(newOption.field.type, name);
            const option = data.result;
            const key = newOption.field.options;
            setOptions((current) => ({
                ...current,
                [key]: [...current[key].filter(({ id }) => id !== option.id), option].sort((a, b) => a.name.localeCompare(b.name)),
            }));
            form.setFieldValue(newOption.field.name, option.id);
            setNewOption(null);
        } catch (error) {
            setNewOption((current) => ({ ...current, error: error.response?.data?.message || "Unable to create the option." }));
        } finally {
            setCreatingOption(false);
        }
    };

    const addLabel = async () => {
        if (!labelName.trim() || addingLabel || saving) return;
        setAddingLabel(true);
        setFeedback(null);
        try {
            const { data } = await createConversationLabel(labelName.trim());
            const label = data.result;
            setOptions((current) => ({
                ...current,
                labels: [...current.labels.filter(({ id }) => id !== label.id), label].sort((a, b) => a.name.localeCompare(b.name)),
            }));
            form.setFieldValue("label_ids", [...new Set([...(form.getFieldValue("label_ids") ?? []), label.id])]);
            setLabelName("");
        } catch (error) {
            setFeedback({ type: "error", message: error.response?.data?.message || "Unable to create the label." });
        } finally {
            setAddingLabel(false);
        }
    };

    const renameOption = (option) => {
        setOptions((current) => ({
            ...current,
            [managing.options]: current[managing.options].map((item) => item.id === option.id ? option : item)
                .sort((a, b) => a.name.localeCompare(b.name)),
        }));
        if (managing.type === "labels") {
            setMetadata((current) => ({ ...current, labels: current.labels.map((item) => item.id === option.id ? option : item) }));
        }
    };

    const removeOption = (id) => {
        setOptions((current) => ({
            ...current,
            [managing.options]: current[managing.options].filter((item) => item.id !== id),
        }));
        const currentValue = form.getFieldValue(managing.name);
        if (managing.type === "labels") {
            form.setFieldValue(managing.name, (currentValue ?? []).filter((value) => value !== id));
            setMetadata((current) => ({ ...current, labels: current.labels.filter((item) => item.id !== id) }));
        } else {
            if (currentValue === id) form.setFieldValue(managing.name, null);
            setMetadata((current) => current[managing.name] === id ? { ...current, [managing.name]: null } : current);
        }
    };

    const eligibleIds = new Set((options?.assignees ?? []).map(({ id }) => id));
    const assigneeOptions = Array.from(users ?? [], ([id, username]) => ({
        value: id,
        label: username,
        disabled: !eligibleIds.has(id),
    }));

    if (metadata?.assignee && !assigneeOptions.some(({ value }) => value === metadata.assignee.id)) {
        assigneeOptions.push({ value: metadata.assignee.id, label: metadata.assignee.username, disabled: true });
    }

    return (
        <section className="ci-conversation-metadata" aria-label="Conversation fields">
            {feedback && <Alert showIcon {...feedback} />}
            {!metadata && !feedback && <Spin size="small" />}
            {metadata && (canEdit ? (
                <Form form={form} layout="vertical" onFinish={save} disabled={saving || addingLabel}>
                    {workflowFields.map(({ name, label, values }) => (
                        <Form.Item key={name} name={name} label={label}>
                            <Select options={[
                                ...values.map((value) => ({ value, label: displayValue(value) })),
                                ...(metadata[name] && !values.includes(metadata[name])
                                    ? [{ value: metadata[name], label: displayValue(metadata[name]), disabled: true }] : []),
                            ]} />
                        </Form.Item>
                    ))}

                    <Form.Item name="assigned_to" label="Assigned to"
                        extra={usersError ? "Unable to load the user list." : "Only active users with Inbox access can be assigned."}>
                        <Select allowClear showSearch optionFilterProp="label" placeholder="Unassigned" options={assigneeOptions} loading={!users && !usersError} notFoundContent="No users found" />
                    </Form.Item>

                    {fields.map((field) => (
                        <div className="ci-metadata-option" key={field.name}>
                            <Form.Item name={field.name} label={<Space size={6}><field.icon aria-hidden="true" />{field.label}</Space>}>
                                <Select allowClear showSearch optionFilterProp="label" placeholder={`Select ${field.label.toLowerCase()}`}
                                    options={options[field.options].map(({ id, name }) => ({ value: id, label: name }))} />
                            </Form.Item>

                            <Button className="ci-metadata-create" type="dashed" block icon={<PlusOutlined />} htmlType="button"
                                disabled={saving || addingLabel} onClick={() => setNewOption({ field, value: "", error: "" })}>
                                Create {field.label}
                            </Button>

                            <Button type="link" size="small" htmlType="button" onClick={() => setManaging(field)}>Manage {field.label}</Button>
                        </div>
                    ))}

                    {canEditLabels && (
                        <Form.Item name="label_ids" label="Labels">
                            <Select mode="multiple" allowClear optionFilterProp="label"
                                options={options.labels.map(({ id, name }) => ({ value: id, label: name }))} />
                        </Form.Item>
                    )}

                    {canReadLabels && !canEditLabels && <LabelList labels={metadata.labels} />}

                    {(canEditLabels || canDeleteLabel) && (
                        <Button type="link" size="small" htmlType="button" onClick={() => setManaging(labelField)}>Manage Labels</Button>
                    )}

                    {canCreateLabel && (
                        <Space.Compact className="ci-label-entry">
                            <Input aria-label="New label name" value={labelName} maxLength={191} placeholder="New label"
                                onChange={(event) => setLabelName(event.target.value)}
                                onPressEnter={(event) => { event.preventDefault(); void addLabel(); }} />
                            <Button htmlType="button" disabled={!labelName.trim()} loading={addingLabel} onClick={addLabel}>Add</Button>
                        </Space.Compact>
                    )}

                    <Button type="primary" block icon={<CheckOutlined />} htmlType="submit" loading={saving}>Save fields</Button>
                </Form>
            ) : (
                <>
                    <dl>
                        {workflowFields.map(({ name, label }) => <div key={name}><dt>{label}</dt><dd>{displayValue(metadata[name])}</dd></div>)}
                        <div>
                            <dt>Assigned to</dt>
                            <dd>{metadata.assignee?.username ?? "Unassigned"}</dd>
                        </div>

                        {fields.map(({ name, label, options: key }) => (
                            <div key={name}>
                                <dt>{label}</dt>
                                <dd>{options[key].find(({ id }) => id === metadata[name])?.name ?? "—"}</dd>
                            </div>
                        ))}
                    </dl>
                    {canReadLabels && <LabelList labels={metadata.labels} />}
                </>
            ))}

            {managing && (
                <ManageMetadataOptions field={managing} options={options[managing.options]}
                    canRename={managing.type === "labels" ? canEditLabels : canEdit}
                    canDelete={managing.type === "labels" ? canDeleteLabel : canEdit}
                    onRename={renameOption} onDelete={removeOption} onClose={() => setManaging(null)} />
            )}
            
            <Modal title={newOption ? `Create ${newOption.field.label}` : "Create option"} centered width={420}
                open={Boolean(newOption)} onOk={addOption} onCancel={() => setNewOption(null)}
                okText="Create" confirmLoading={creatingOption} okButtonProps={{ disabled: !newOption?.value.trim() }}
                cancelButtonProps={{ disabled: creatingOption }} closable={!creatingOption} keyboard={!creatingOption} maskClosable={!creatingOption}>
                {newOption && (
                    <Space direction="vertical" className="ci-metadata-dialog" size={10}>
                        {newOption.error && <Alert type="error" showIcon message={newOption.error} />}
                        <Typography.Text strong><label htmlFor="ci-metadata-option-name">{newOption.field.label} name</label></Typography.Text>
                        <Input id="ci-metadata-option-name" placeholder={`e.g. ${newOption.field.example}`} maxLength={80} showCount
                            value={newOption.value} disabled={creatingOption}
                            onChange={(event) => setNewOption((current) => ({ ...current, value: event.target.value, error: "" }))} onPressEnter={addOption} />
                        <Typography.Text type="secondary">The new option is available across channels. Use Save fields to apply it to this chat.</Typography.Text>
                    </Space>
                )}
            </Modal>
        </section>
    );
}

function LabelList({ labels }) {
    return (
        <Space wrap size={4}>
            <Typography.Text strong>Labels</Typography.Text>
            {labels.length ? labels.map(({ id, name, color }) => <Tag key={id} color={color || undefined}>{name}</Tag>) : <Typography.Text type="secondary">None</Typography.Text>}
        </Space>
    );
}
