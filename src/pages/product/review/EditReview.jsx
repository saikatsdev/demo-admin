import { Input as AntInput, Breadcrumb, Button, Form,Select,InputNumber, message,Space } from "antd";
import {ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";
import ImagePicker from "../../../components/image/ImagePicker";

const { Option } = Select;

export default function EditReview() {
    // Hook
    useTitle("Edit Review");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const {id} = useParams();

    // State
    const [products, setProducts]     = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const [gallery, setGallery] = useState([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

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
                              url: data.img_path, 
                          },
                      ]
                    : [],
                });
            }
        }

        const fetchData = async () => {
            try {
                const productRes = await getDatas("/admin/products/list");

                setProducts(productRes?.result || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        getSingleReview();
        fetchData();
        fetchMedia(1);
    }, [id]);

    const fetchMedia = async (pageNumber = 1) => {
        try {
            setLoadingMore(true);
            const res = await getDatas(`/admin/gallary?page=${pageNumber}`);

            if (res && res?.success) {
                const data = res.result.data;

                if (pageNumber > 1) {
                    setGallery(prev => [...prev, ...data]);
                } else {
                    setGallery(data);
                }

                const meta = res.result.meta;
                setPage(meta.current_page);
                setHasMore(meta.current_page < meta.last_page);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoadingMore(false);
        }
    };


    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("title", values.title);
        formData.append("product_id", values.product_id);
        formData.append("rating", values.rating);
        formData.append("review", values.review);
        formData.append("status", values.status);

        const image = values.image?.[0];
        if (image) {
            if (image.originFileObj) {
                formData.append('image', image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append('image', image.galleryPath);
            }
            formData.append('width', 450);
            formData.append('height', 450);
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
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
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
                    <h1 className="title">Edit Review</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Review" },
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

                    <ImagePicker 
                        form={form} 
                        name="image" 
                        label="Image" 
                        gallery={gallery}  
                        hasMore={hasMore} 
                        loadingMore={loadingMore} 
                        fetchMore={() => fetchMedia(page + 1)} 
                        onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])} 
                    />

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
                        <Button type="primary" htmlType="submit" loading={formLoading}>
                            Update Review
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </>
    )
}
