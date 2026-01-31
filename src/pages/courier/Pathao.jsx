import {Input as AntInput,Breadcrumb,Button,Form,Space,message} from "antd";
import { ArrowLeftOutlined, UnorderedListOutlined,PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import {useAppSettings} from "../../contexts/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";

export default function Pathao() {
    // Hook
    useTitle("Add Pathao Credentials");

    // Variable
    const navigate = useNavigate();

    const {settings} = useAppSettings();

    // State
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getPathao = async () => {
            const res = await getDatas("/admin/pathao/show");

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    pathao_endpoint:data.endpoint,
                    pathao_client_id:data.client_id,
                    pathao_client_secret:data.client_secret,
                    pathao_username:data.username,
                    pathao_password:data.password,
                    pathao_grant_type:data.grant_type,
                });
            }
        };

        getPathao();
    }, []);

    // Method
    const handleSubmit = async () => {
        const values = await form.validateFields();
        
        try {
            setLoading(true);
            const res = await postData("/admin/pathao/update/env-credential", values);

            if (res?.success) {
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

    const handleStoreList = () => {
        navigate("/all/store");
    }

    const handleStoreCreate = () => {
        navigate("/store/create");
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Pathao Credentials</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Pathao Credentials" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent:"flex-end" }}>
                <Space>
                    <Button type="primary" icon={<PlusOutlined  />} onClick={handleStoreCreate}>
                        Create Store
                    </Button>

                    <Button type="primary" icon={<UnorderedListOutlined />} onClick={handleStoreList}>
                        Store List
                    </Button>

                    <Button icon={<ArrowLeftOutlined />}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="single-form-layout">
                <h2>Update Info</h2>
                <Form layout="horizontal" form={form}>
                    <div className="pathao-dis">
                        <Form.Item label="Pathao EndPoint" name="pathao_endpoint" rules={[{ required: true, message: "Endpoint is required" }]}>
                            <AntInput placeholder="Enter End Point" />
                        </Form.Item>

                        <Form.Item label="Client ID" name="pathao_client_id" rules={[{ required: true, message: "Client ID is required" }]}>
                            <AntInput placeholder="Enter Client ID" />
                        </Form.Item>

                        <Form.Item label="Client Secret" name="pathao_client_secret" rules={[{ required: true, message: "Client Secret is required" }]}>
                            <AntInput placeholder="Enter Client Secret" />
                        </Form.Item>

                        <Form.Item label="Username" name="pathao_username" rules={[{ required: true, message: "Username is required" }]}>
                            <AntInput placeholder="Enter pathao email" />
                        </Form.Item>

                        <Form.Item label="Password" name="pathao_password" rules={[{ required: true, message: "Password is required" }]}>
                            <AntInput.Password placeholder="Enter pathao password" />
                        </Form.Item>

                        <Form.Item label="Grant Type" name="pathao_grant_type"  rules={[{ required: true, message: "Grant Type is required" }]}>
                            <AntInput placeholder="Enter grant type" />
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
                    </div>
                </Form>

                <div>
                    <WebhookDisplay settings={settings} service="pathao"/>
                </div>

            </div>
        </>
    )
}
