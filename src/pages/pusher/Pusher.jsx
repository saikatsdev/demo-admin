import useTitle from "../../hooks/useTitle"
import { Input as AntInput, Breadcrumb, Button, Form, message } from "antd";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Pusher() {
    // Hook
    useTitle("Pusher Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [pusherConfig, setPusherConfig] = useState({key: import.meta.env.VITE_PUSHER_APP_KEY,});

    // Method
    useEffect(() => {
        const fetchPusher = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/admin/pusher`,
                    {
                        credentials: 'include',
                        headers: {
                            Accept: 'application/json',
                        },
                    }
                );

                const contentType = res.headers.get('content-type');

                if (!contentType || !contentType.includes('application/json')) {
                    const text = await res.text();
                    console.warn('Non-JSON response:', text);
                    return;
                }

                const data = await res.json();
                console.log('Pusher API Data:', data);

                form.setFieldsValue({
                    app_id: data?.app_id ?? '',
                    app_key: data?.app_key ?? '',
                    app_secret: data?.app_secret ?? '',
                });
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
            formData.append('_method', 'PUT');

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/admin/pusher`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    body: formData,
                }
            );

            const contentType = res.headers.get('content-type');

            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                console.error('Non-JSON response:', text);
                return;
            }

            const data = await res.json();

            if (data.success) {
                setPusherConfig(prev => ({...prev,key: values.app_key}));
                messageApi.open({
                    type: 'success',
                    content: data.message || 'Updated successfully',
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

    console.log(pusherConfig);

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

                        <Form.Item style={{textAlign:"right"}}>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Update
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
