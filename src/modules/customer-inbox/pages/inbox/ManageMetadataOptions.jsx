import { Alert, Button, Empty, Input, Modal, Space, Typography } from "antd";
import { useState } from "react";
import { deleteConversationMetadataOption, renameConversationMetadataOption } from "../../api/inboxApi";

export default function ManageMetadataOptions({ field, options, canRename, canDelete, onRename, onDelete, onClose }) {
    const [action, setAction] = useState(null);
    const [busy, setBusy]     = useState(false);
    const [error, setError]   = useState("");
    const maxLength           = field.type === "labels" ? 191 : 80;

    const submit = async () => {
        if (!action || busy) return;

        const deleting = action.type === "delete";

        if (deleting ? !canDelete : !canRename || !action.name.trim()) return;

        setBusy(true);

        setError("");

        try {
            if (deleting) {
                await deleteConversationMetadataOption(field.type, action.option.id);
                onDelete(action.option.id);
            } else {
                const { data } = await renameConversationMetadataOption(field.type, action.option.id, action.name.trim());
                onRename(data.result);
            }

            setAction(null);
        } catch (failure) {
            setError(failure.response?.data?.message || "Unable to update the option.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title={`Manage ${field.label}`} open centered width={480}
            onCancel={onClose} footer={null} closable={!busy} keyboard={!busy} maskClosable={!busy}>
            <div className="ci-metadata-manage-list">
                {!options.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No options yet" />}
                {options.map((option) => (
                    <div className="ci-metadata-manage-row" key={option.id}>
                        <Typography.Text>{option.name}</Typography.Text>
                        <Space size={4}>
                            {canRename && <Button size="small" onClick={() => { setError(""); setAction({ type: "edit", option, name: option.name }); }}>Edit</Button>}
                            {canDelete && <Button size="small" danger onClick={() => { setError(""); setAction({ type: "delete", option }); }}>Delete</Button>}
                        </Space>
                    </div>
                ))}
            </div>

            <Modal title={action?.type === "delete" ? "Delete option?" : "Edit name"} open={Boolean(action)} centered width={420} onOk={submit} onCancel={() => setAction(null)} confirmLoading={busy} okText={action?.type === "delete" ? "Delete" : "Save"} okButtonProps={{ danger: action?.type === "delete", disabled: action?.type === "edit" && !action?.name.trim() }} cancelButtonProps={{ disabled: busy }} closable={!busy} keyboard={!busy} maskClosable={!busy}>
                <Space direction="vertical" className="ci-metadata-dialog">
                    {error && <Alert type="error" showIcon message={error} />}
                    {action?.type === "delete" ? (
                        <Typography.Text><strong>{action.option.name}</strong> will be removed from every chat using it. Chat history will stay in the Inbox.</Typography.Text>
                    ) : action && (
                        <Input aria-label="Option name" maxLength={maxLength} value={action.name} disabled={busy} onChange={(event) => setAction((current) => ({ ...current, name: event.target.value }))} onPressEnter={submit} />
                    )}
                </Space>
            </Modal>
        </Modal>
    );
}
