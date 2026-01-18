
import { Input as AntInput, Breadcrumb, Button, Form, Select,message } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function BlockSettings() {
    // Hook
    useTitle("Block Settings");

    // State
    const [form]                      = Form.useForm();
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const id = 1;

    useEffect(() => {
        let isMounted = true;

        const fetchedOrderGuard = async () => {
            const res = await getDatas(`/admin/order-guards/${id}`);

            if(res && res?.success){
                const list = res?.result;

                if(isMounted){
                    form.setFieldsValue({
                        quantity               : list.quantity,
                        duration               : list.duration,
                        allow_percentage       : list.allow_percentage,
                        duration_type          : list.duration_type,
                        block_message          : list.block_message,
                        permanent_block_message: list.permanent_block_message,
                        courier_block_message  : list.courier_block_message,
                        status                 : list.status,
                    });
                }
            }
        }

        fetchedOrderGuard();

        return () => {
            isMounted = false;
        }
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('quantity', values.quantity);
        formData.append('duration', values.duration);
        formData.append('allow_percentage', values.allow_percentage);
        formData.append('duration_type', values.duration_type);
        formData.append('block_message', values.block_message);
        formData.append('permanent_block_message', values.permanent_block_message);
        formData.append('courier_block_message', values.courier_block_message);
        if(values.status) formData.append("status", values.status);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData(`/admin/order-guards/${id}`, formData);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
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
                    <h1 className="title">Block Settings</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Block Settings" },
                        ]}
                    />
                </div>
            </div>

            <div className="block-settings">
                <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{width:"960", height:"1200"}}>
                    <div>
                        <Form.Item label="Maximum Order">
                            <Form.Item name="quantity" noStyle>
                                <AntInput type="number" placeholder="Enter quantity" />
                            </Form.Item>
                        </Form.Item>


                        <Form.Item label="Order Blocking Duration">
                            <Form.Item name="duration" noStyle rules={[{ required: true }]}>
                                <AntInput type="number" placeholder="Enter duration" />
                            </Form.Item>
                        </Form.Item>

                        <Form.Item label="Order Blocking Percentage">
                            <Form.Item name="allow_percentage" noStyle rules={[{ required: true }]}>
                                <AntInput type="number" placeholder="Enter percentage" />
                            </Form.Item>
                        </Form.Item>

                        <Form.Item label="Duration Type">
                            <Form.Item name="duration_type" noStyle>
                                <Select
                                    options={[
                                        { value: "minutes", label: "Minutes" },
                                        { value: "hours", label: "Hours" },
                                        { value: "days", label: "Days" }
                                    ]}
                                />
                            </Form.Item>
                        </Form.Item>

                        <Form.Item name="block_message" label="Block Message" rules={[{ required: true, message:"Please enter a message" }]}>
                            <AntInput.TextArea type="text" placeholder="Enter message" />
                        </Form.Item>

                        <Form.Item name="permanent_block_message" label="Permanent Block Message" rules={[{ required: true, message:"Please enter a message" }]}>
                            <AntInput.TextArea type="text" placeholder="Enter message" />
                        </Form.Item>

                        <Form.Item name="courier_block_message" label="Courier Message" rules={[{ required: true, message:"Please enter a message" }]}>
                            <AntInput.TextArea type="text" placeholder="Enter message" />
                        </Form.Item>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: 'active', label: 'Active' },{ value: 'inactive', label: 'Inactive'}]} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                {loading ? "Updating..." : "Update Settings"}
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
