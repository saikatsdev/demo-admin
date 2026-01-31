import {Input as AntInput,Breadcrumb,Button,Form,Space,message} from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import { useEffect, useState } from "react";
import {useAppSettings} from "../../contexts/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";

export default function RedX() {
    // Hook
    useTitle("Add RedX Credentials");

    const {settings} = useAppSettings();

    // State
    const [form]                      = Form.useForm();
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getRedx = async () => {
            const res = await getDatas("/admin/redx/show");

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    redx_endpoint  : data?.endpoint,
                    redx_token   : data?.token,
                });
            }
        };

        getRedx();
    }, []);

    // Method
    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);

            const res = await postData("/admin/redx/update/env-credential", values);

            if (res && res?.success) {

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
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">RedX Credentials</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "RedX Credentials" },
                        ]}
                    />
                </div>
            </div>

            <div className="single-form-layout">
                <h2>Update Info</h2>
                <Form layout="horizontal" form={form}>
                    <Form.Item label="RedX EndPoint" name="redx_endpoint" rules={[{ required: true, message: "Endpoint is required" }]}>
                        <AntInput placeholder="Enter End Point" />
                    </Form.Item>

                    <Form.Item label="Token" name="redx_token" rules={[{ required: true, message: "Token ID is required" }]}>
                        <AntInput placeholder="Enter Token" />
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
                    <WebhookDisplay settings={settings} service="redx"/>
                </div>

            </div>
        </>
    )
}
