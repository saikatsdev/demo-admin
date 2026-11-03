import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Result, Row, Select, Skeleton, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { createRawMaterial, getRawMaterial, updateRawMaterial } from "../../api/rawMaterialApi";

export default function RawMaterialEditor() {
    const { id }                      = useParams();
    const editing                     = Boolean(id);
    const navigate                    = useNavigate();
    const { can }                     = usePermission();
    const allowed                     = can(editing ? "raw-materials-update" : "raw-materials-create");
    const [form]                      = Form.useForm();
    const [loading, setLoading]       = useState(editing);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    useTitle(`${editing ? "Edit" : "Add"} Raw Material | Inventory & Stock`);

    useEffect(() => { 
        if (!editing || !allowed) return; 
        getRawMaterial(id).then((r) => { 
            if (r?.success) {
                form.setFieldsValue(r.result);
            } else {
                setError("Raw material not found"); 
            }
        }).finally(() => setLoading(false)); 
    }, [allowed, editing, form, id]);

    const submit = async (values) => { 
        setSaving(true); 
        setError(""); 
        const r = editing ? await updateRawMaterial(id, values) : await createRawMaterial(values); setSaving(false);

        if (!r?.success) { 
            setError(Object.values(r?.errors || {}).flat()[0] || r?.msg || "Unable to save raw material"); 
            return; 
        } 

        messageApi.success(r.msg); 
        navigate("/raw-materials"); 
    };

    if (!allowed) return <Result status="403" title="Raw material access required" />;

    return (
        <div className="purchase-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="purchase-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate("/raw-materials")}>
                        Back to raw materials
                    </Button>

                    <h1 className="title">{editing ? "Edit raw material" : "Add raw material"}</h1>

                    <p className="purchase-subtitle">
                        Maintain reusable material identity, unit and standard purchase price.
                    </p>
                </div>
            </div>

            <Card className="purchase-form-card">
                {loading ? <Skeleton active /> : 
                    <Form form={form} layout="vertical" initialValues={{ status: "active", buy_price: 0 }} onFinish={submit}>

                        <Alert showIcon type="info" message="Material code is generated automatically (RM0001, RM0002…)." style={{ marginBottom: 20 }} />

                        {error && <Alert showIcon type="error" message={error} style={{ marginBottom: 20 }} />}

                        <Row gutter={20}>
                            <Col xs={24} md={12}>
                                <Form.Item name="name" label="Material name" rules={[{ required: true, message: "Enter material name" }]}>
                                    <Input placeholder="e.g. Cotton fabric" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item name="unit" label="Stock unit" rules={[{ required: true, message: "Enter stock unit" }]}>
                                    <Input placeholder="kg, litre, metre, piece…" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item name="buy_price" label="Default buy price" rules={[{ required: true }]}>
                                    <InputNumber min={0} precision={2} prefix="৳" style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item name="alert_quantity" label="Low-stock alert quantity">
                                    <InputNumber min={0} precision={4} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={8}>
                                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                    <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="note" label="Note">
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        <div className="purchase-form-actions">
                            <Button onClick={() => navigate("/raw-materials")}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={saving}>{editing ? "Save changes" : "Create raw material"}</Button>
                        </div>
                    </Form>
                }
            </Card>
        </div>
    );
}
