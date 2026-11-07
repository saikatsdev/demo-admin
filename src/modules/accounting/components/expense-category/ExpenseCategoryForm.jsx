import {Alert,Form,Input,Modal,Select} from "antd";

import { useEffect } from "react";

export default function ExpenseCategoryForm({open,category,saving,error,fieldErrors,onCancel,onSave}) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (!open) return;

        form.resetFields();

        form.setFieldsValue(
            category
                ? {
                    name: category.name,
                    description: category.description || "",
                    status: category.status ? 1 : 0,
                }
                : {
                    status: 1,
                }
        );
    }, [open, category, form]);

    useEffect(() => {
        if (!fieldErrors) return;

        form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
                name,
                errors: Array.isArray(errors) ? errors : [errors],
            }))
        );
    }, [fieldErrors, form]);

    return (
        <Modal
            open={open}
            title={
                category ? "Edit Expense Category" : "Add Expense Category"
            }
            okText={category ? "Save Changes" : "Create Category"}
            confirmLoading={saving}
            onCancel={onCancel}
            onOk={() => form.submit()}
            destroyOnHidden
        >
            {error && (
                <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }}/>
            )}

            <Form form={form} layout="vertical" onFinish={onSave} disabled={saving} requiredMark="optional">
                <Form.Item
                    name="name"
                    label="Category Name"
                    rules={[
                        {
                            required: true,
                            whitespace: true,
                            message: "Category name is required",
                        },
                    ]}
                >
                    <Input maxLength={120} placeholder="e.g. Marketing, Office Rent, Utility"/>
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Status"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Select
                        options={[
                            { value: 1, label: "Active" },
                            { value: 0, label: "Inactive" },
                        ]}
                    />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Optional category description"/>
                </Form.Item>
            </Form>
        </Modal>
    );
}