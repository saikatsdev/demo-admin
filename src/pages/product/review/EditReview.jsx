import { Input as AntInput, Breadcrumb, Button, Form,Select,InputNumber, message,Upload,Space } from "antd";
import {ArrowLeftOutlined,UploadOutlined  } from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";

const { Option } = Select;

export default function EditReview() {
    // Hook
    useTitle("Edit Review");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const {id} = useParams();

    // State
    const [loading, setLoading]       = useState(false);
    const [products, setProducts]     = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getSingleReview = async () => {
            const res = await getDatas(`/admin/product/reviews/${id}`);

            if(res && res?.success){
                const data = res?.result || [];

                form.setFieldsValue({
                    name      : data.name,
                    email     : data.email,
                    product_id: data.product_id,
                    title     : data.title,
                    rating    : data.rating,
                    review    : data.review,
                    status    : data.status,

                    image: data.img_path
                    ? [
                          {
                              uid: "-1",
                              name: "review-image",
                              status: "done",
                              url: data.img_path ?? data.img_path, 
                          },
                      ]
                    : [],
                });
            }
        }

        getSingleReview();
    }, [id]);

    // Method
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const productRes = await getDatas("/admin/products/list");

                setProducts(productRes?.result || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("title", values.title);
        formData.append("product_id", values.product_id);
        formData.append("rating", values.rating);
        formData.append("review", values.review);
        formData.append("status", values.status);

        if (values.image?.length) {
            const file = values.image[0];

            if (file.originFileObj) {
                formData.append("image", file.originFileObj);
                formData.append('width', 450);
                formData.append('height', 450);
            }
        }

        formData.append("_method", "PUT");

        try {
            setFormLoading(true);

            const res = await postData(`/admin/product/reviews/${id}`, formData);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/review");
                }, 400);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setFormLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Reviews</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Reviews" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div></div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <div className="review-form-wrapper">
                <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ maxWidth: 600, marginTop: 20 }}>

                    <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please provide a name!" }]}>
                        <AntInput style={{ width: "100%" }} placeholder="Enter Name" />
                    </Form.Item>

                    <Form.Item label="Email" name="email">
                        <AntInput style={{ width: "100%" }} placeholder="Enter email" />
                    </Form.Item>

                    <Form.Item label="Review Title" name="title">
                        <AntInput style={{ width: "100%" }} placeholder="Enter title" />
                    </Form.Item>

                    <Form.Item label="Rating" name="rating">
                        <InputNumber min={1} max={5} style={{ width: "100%" }} placeholder="Enter rating" />
                    </Form.Item>

                    <Form.Item label="Image" name="image" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                        <Upload beforeUpload={() => false} listType="picture" maxCount={1} accept="image/*">
                            <Button icon={<UploadOutlined />}>Upload Image</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Product ID" name="product_id" rules={[{ required: true, message: "Please select a product!" }]}>
                        <Select placeholder="Select Product" showSearch optionFilterProp="children" filterOption={(input, option) =>
                            (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                        }>
                            {products?.map((item) => (
                                <Option value={item.id}>{item.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Review" name="review">
                        <AntInput.TextArea rows={4} placeholder="Write your review..." />
                    </Form.Item>

                    <Form.Item label="Status" name="status" rules={[{ required: true, message: "Please select status!" }]}>
                        <Select placeholder="Select Status">
                            <Option value="pending">Pending</Option>
                            <Option value="approved">Approved</Option>
                            <Option value="cancelled">Cancelled</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {formLoading ? "Updating..." : "Update Review"}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </>
    )
}
