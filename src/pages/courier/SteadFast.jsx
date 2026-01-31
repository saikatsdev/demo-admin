import { Input as AntInput, Breadcrumb, Button, Form, Space, message } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import useAppSettings from "../../hooks/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";

export default function SteadFast() {
    // Hook
    useTitle("Add SteadFast Credentials");

    const {settings} = useAppSettings();

    // State
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);
    const [showForm, setShowForm]     = useState(false);

    useEffect(() => {
        const getSteadfast = async () => {
            const res = await getDatas("/admin/stead-fasts/show");

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    stead_fast_endpoint  : data?.endpoint,
                    stead_fast_api_key   : data?.api_key,
                    stead_fast_secret_key: data?.secret_key,
                });

                
            }
        };

        getSteadfast();
    }, []);

    // Form
    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);
            const res = await postData("/admin/stead-fasts/update/env-credential", values);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res?.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        SteadFast Credentials
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "SteadFast Credentials" },
                        ]}
                    />
                </div>
            </div>

            <div>
                <Button type="primary" icon={showForm ? <MinusOutlined /> : <PlusOutlined />} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Hide Form" : "Add Credentials"}
                </Button>
            </div>

            {showForm && (
                <div className="single-form-layout">
                    <h2>Update Info</h2>
                    <Form layout="horizontal" form={form}>
                        <Form.Item label="SteadFast EndPoint" name="stead_fast_endpoint" rules={[{ required: true, message: "Endpoint is required" }]}>
                            <AntInput placeholder="Enter End Point" />
                        </Form.Item>

                        <Form.Item label="SteadFast Api Key" name="stead_fast_api_key" rules={[{ required: true, message: "Api Key is required" }]}>
                            <AntInput placeholder="Enter API Key" />
                        </Form.Item>

                        <Form.Item label="SteadFast Secret Key" name="stead_fast_secret_key" rules={[{ required: true, message: "Secret key is required" }]}>
                            <AntInput placeholder="Enter Secret Key" />
                        </Form.Item>

                        <div style={{ textAlign: "right" }}>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" onClick={handleSubmit}>
                                        {loading ? "Updating..." : "Update Info"}
                                    </Button>
                                    <Button onClick={() => window.history.back()}>Back</Button>
                                </Space>
                            </Form.Item>
                        </div>
                    </Form>

                    <div>
                        <WebhookDisplay settings={settings} service="stead-fast"/>
                    </div>

                </div>
            )}
        </>
    )
}
