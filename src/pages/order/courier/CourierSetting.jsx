import useTitle from "../../../hooks/useTitle"

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Form, message,Select} from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";

export default function CourierSetting() {
    // Hook
    useTitle("Courier Settings");

    // State
    const [form]                              = Form.useForm();
    const [messageApi, contextHolder]         = message.useMessage();
    const [loading, setLoading]               = useState(false);
    const [couriers, setCouriers]               = useState([]);

    const fetchCouriers = async () => {
        try {
            setLoading(true);

            const res = await getDatas("/admin/couriers");

            if (res && res?.success) {
                const data = res.result.data;

                setCouriers(data);

                const defaultCourier = data.find(c => c.is_default === 1);

                if (defaultCourier) {
                    form.setFieldsValue({
                        courier_id: defaultCourier.id
                    });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouriers();
    }, []);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('courier_id', values.courier_id);

        try {
            setLoading(true);
            const res = await postData("/admin/couriers/settings", formData);

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
                    <h1 className="title">Courier Settings</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Courier Settings" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Courier Settings</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit}>
                        <Form.Item name="courier_id" label="Select Default Courier" rules={[{ required: true, message: "Please select a courier" }]}>
                            <Select placeholder="Select Courier" loading={loading} options={couriers.map(courier => ({value: courier.id,label: courier.name}))}/>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                {loading ? "Updating..." : "Update"}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </>
    )
}
