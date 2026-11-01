import { EnvironmentOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Switch } from "antd";
import { useEffect } from "react";

const statusOptions = 
[
    { 
        value: "active", 
        label: "Active" 
    },
    { 
        value: "inactive", 
        label: "Inactive" 
    },
    { 
        value: "draft",
        label: "Draft" 
    },
];

export default function WarehouseForm({ warehouse, saving, serverError, fieldErrors, onSave, onCancel, onChange }) {
    const [form] = Form.useForm();

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(warehouse || { status: "active", is_default: false });
    }, [form, warehouse]);

    useEffect(() => {
        if (!fieldErrors) return;
        form.setFields(Object.entries(fieldErrors).map(([name, errors]) => ({ name, errors: Array.isArray(errors) ? errors : [errors] })));
    }, [fieldErrors, form]);

    const field = (name, label, input, rules = [], span = 12) => (
        <Col xs={24} md={span} key={name}>
            <Form.Item name={name} label={label} rules={rules}>{input}</Form.Item>
        </Col>
    );
    const required = (label) => [{ required: true, whitespace: true, message: `${label} is required` }];

    return (
        <Card className="warehouse-editor-card" styles={{ body: { padding: 0 } }}>
            {serverError && <Alert type="error" showIcon message={serverError} className="warehouse-form-error" />}
            <Form form={form} layout="vertical" onFinish={onSave} onValuesChange={onChange} disabled={saving} requiredMark="optional">
                <section className="warehouse-form-section">
                    <div className="warehouse-section-heading">
                        <span className="warehouse-section-icon">
                            <ShopOutlined />
                        </span>

                        <div>
                            <h2>
                                Warehouse information
                            </h2>

                            <p>
                                Identity, operational status and responsible contact details.
                            </p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        {field("name", "Warehouse name", <Input size="large" placeholder="e.g. Dhaka Central Warehouse" maxLength={255} />, required("Warehouse name"), 16)}

                        {field("status", "Status", <Select size="large" options={statusOptions} />, [{ required: true, message: "Select a status" }], 8)}

                        {field("contact_person", "Contact person", <Input size="large" placeholder="Warehouse manager or contact" maxLength={255} />)}

                        {field("phone_number", "Phone number", <Input size="large" placeholder="Contact phone number" maxLength={30} />)}

                        {field("email", "Email", <Input size="large" placeholder="warehouse@example.com" maxLength={255} />, [{ type: "email", message: "Enter a valid email address" }])}

                        <Col xs={24} md={12}>
                            <Form.Item name="is_default" label="Default warehouse" valuePropName="checked" extra="Used as the primary warehouse when a location is not selected.">
                                <Switch checkedChildren="Default" unCheckedChildren="Regular" />
                            </Form.Item>
                        </Col>
                    </Row>
                </section>

                <section className="warehouse-form-section warehouse-location-section">
                    <div className="warehouse-section-heading">
                        <span className="warehouse-section-icon warehouse-location-icon">
                            <EnvironmentOutlined />
                        </span>

                        <div>
                            <h2>Location & notes</h2>
                            <p>Where the warehouse operates and any internal handling instructions.</p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        {field("address", "Warehouse address", <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Enter the complete warehouse address" />, required("Warehouse address"), 24)}
                        
                        {field("note", "Internal notes", <Input.TextArea rows={3} maxLength={5000} showCount placeholder="Add access, handling or operational notes" />, [], 24)}
                    </Row>
                </section>

                <div className="warehouse-form-actions">
                    <Space>
                        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={saving}>{warehouse ? "Save changes" : "Create warehouse"}</Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}
