import useTitle from "../../hooks/useTitle"
import { Input as AntInput, Breadcrumb, Button, Form, message,Popconfirm } from "antd";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function Pusher() {
    // Hook
    useTitle("Pusher Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [loading, setLoading]       = useState(false);
    const [showForm, setShowForm]     = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Method
    useEffect(() => {
        const fetchPusher = async () => {
            try {
                const res = await getDatas("/admin/pusher");

                if(res && res?.success){
                    const data = res?.result || [];

                    form.setFieldsValue({
                        app_id       : data?.app_id ?? '',
                        app_key      : data?.app_key ?? '',
                        app_secret   : data?.app_secret ?? '',
                        pusher_host  : data?.pusher_host ?? '',
                        pusher_port  : data?.pusher_port ?? '',
                        pusher_scheme: data?.pusher_scheme ?? '',
                        app_cluster  : data?.app_cluster ?? '',
                    });
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchPusher();
    }, []);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('app_id', values.app_id);
            formData.append('app_key', values.app_key);
            formData.append('app_secret', values.app_secret);
            formData.append('pusher_host', values.pusher_host);
            formData.append('pusher_port', values.pusher_port);
            formData.append('pusher_scheme', values.pusher_scheme);
            formData.append('app_cluster', values.app_cluster);
            formData.append('_method', 'PUT');

            const res = await postData("/admin/pusher", formData);

            if(res && res?.success){
                messageApi.open({
                    type: 'error',
                    content: res?.msg,
                });
            }

        } catch (error) {
            console.error('Submit error:', error);
            messageApi.open({
                type: 'error',
                content: 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Pusher Setting</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Pusher Setting" },
                        ]}
                    />
                </div>
            </div>

            <div className="catelog-form">
                {!showForm ? (
                    <Popconfirm title="Important Warning" description="Updating pusher is a critical action. Please be very careful before making any changes." okText="I Understand" cancelText="Cancel" onConfirm={() => setShowForm(true)}>
                        <Button type="primary" danger>
                            Update Pusher
                        </Button>
                    </Popconfirm>
                ) : (
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <div>
                            <Form.Item name="app_id" label="APP ID">
                                <AntInput placeholder="Enter app id" />
                            </Form.Item>

                            <Form.Item name="app_key" label="APP KEY">
                                <AntInput placeholder="Enter app key" />
                            </Form.Item>

                            <Form.Item name="app_secret" label="APP SECRET">
                                <AntInput placeholder="Enter secret key" />
                            </Form.Item>

                            <Form.Item name="pusher_host" label="Pusher Host">
                                <AntInput placeholder="Enter pusher host" />
                            </Form.Item>

                            <Form.Item name="pusher_port" label="Pusher Port">
                                <AntInput placeholder="Enter pusher port" />
                            </Form.Item>

                            <Form.Item name="pusher_scheme" label="Pusher Scheme">
                                <AntInput placeholder="Enter pusher scheme" />
                            </Form.Item>

                            <Form.Item name="app_cluster" label="Pusher App Cluster">
                                <AntInput placeholder="Enter app cluster" />
                            </Form.Item>

                            <Form.Item style={{textAlign:"right"}}>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Update
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                )}
            </div>
        </>
    )
}
