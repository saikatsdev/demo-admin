import {Input as AntInput,Breadcrumb,Button,Form,Space,message} from "antd";
import { ArrowLeftOutlined, UnorderedListOutlined,PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../api/common/common";
import { useState } from "react";
import useTitle from "../../hooks/useTitle";

export default function Pathao() {
    // Hook
    useTitle("Add Pathao Credentials");

    // Variable
    const navigate = useNavigate();

    // State
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

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
                            <AntInput placeholder="Enter End Point" />
                        </Form.Item>

                        <Form.Item label="Client Secret" name="pathao_client_secret" rules={[{ required: true, message: "Client Secret is required" }]}>
                            <AntInput placeholder="Enter API Key" />
                        </Form.Item>

                        <Form.Item label="Username" name="pathao_username" rules={[{ required: true, message: "Username is required" }]}>
                            <AntInput placeholder="Enter API Key" />
                        </Form.Item>

                        <Form.Item label="Password" name="pathao_password" rules={[{ required: true, message: "Password is required" }]}>
                            <AntInput.Password placeholder="Enter Secret Key" />
                        </Form.Item>

                        <Form.Item label="Grant Type" name="pathao_grant_type"  rules={[{ required: true, message: "Grant Type is required" }]}>
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
                    </div>
                </Form>
            </div>
        </>
    )
}
