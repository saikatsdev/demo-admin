import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeftOutlined  } from "@ant-design/icons";
import useTitle from "../../../hooks/useTitle"
import { Input as AntInput, Breadcrumb, Button, Form,Select, message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";
import ImagePicker from "../../../components/image/ImagePicker";

export default function EditSubCategory() {
    // Hook
    useTitle("Edit SubCategory");

    // Variable
    const {id} = useParams();
    const navigate = useNavigate();

    // State
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [form]                                = Form.useForm();
    const [messageApi, contextHolder]           = message.useMessage();
    const [loading, setLoading]                 = useState(false);
    const [page, setPage]                       = useState(1);
    const [hasMore, setHasMore]                 = useState(true);
    const [loadingMore, setLoadingMore]         = useState(false);
    const [gallery, setGallery]                 = useState([]);


    useEffect(() => {
        fetchMedia(page);
    }, []);

    const fetchMedia = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
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
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Method
    useEffect(() => {
        let isAlive = true;

        const getData = async () => {
            const [subcategoryRes, categoryRes] = await Promise.all([
                getDatas(`/admin/sub-categories/${id}`),
                getDatas("/admin/categories/list"),
            ]);

            if(!isAlive) return;

            if(subcategoryRes && subcategoryRes?.success){
                const subcategory = subcategoryRes?.result;
                const imageFileList = subcategory.image
                    ? [
                        {
                            uid: "-1",
                            name: "subcategory.png",
                            status: "done",            
                            url: subcategory.image,
                        },
                    ]
                    : [];

                form.setFieldsValue({
                    name: subcategory.name,
                    category_id: subcategory.category.id,
                    status: subcategory.status,
                    image: imageFileList,
                });
            }

            if(categoryRes && categoryRes?.result){
                setCategoryOptions(categoryRes?.result);
            }
        }
        getData();

        return () => {
            isAlive = false;
        }
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("status", values.status);
        formData.append("category_id", values.category_id);
        
        const image = values.image?.[0];
        if (image) {
            if (image.originFileObj) {
                formData.append('image', image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append('image', image.galleryPath);
            }
        }

        formData.append('width', values.width);
        formData.append('height', values.height);
        formData.append('_method', "PUT");

        setLoading(true);

        try {
            const res = await postData(`/admin/sub-categories/${id}`, formData);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/subcategories");
                }, 400);
            }
        } catch (error) {
            console.log("Something went wrong", error);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Sub Categories</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Sub Category" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Edit Sub Category</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="blog-form-layout">
                    <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{width:450, height:450}}>
                        <Form.Item label="Sub Category Name" name="name">
                            <AntInput placeholder="Enter name" />
                        </Form.Item>

                        <Form.Item name="category_id" label="Select Category" rules={[{ required: true, message: "Please select a category!" }]} >
                            <Select placeholder="Select a category" showSearch optionFilterProp="children" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                                {categoryOptions.map((cat) => (
                                <Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <ImagePicker form={form} name="image" label="Image" gallery={gallery}  hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)}/>

                        <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                            <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                        </Form.Item>

                        <div style={{display:"flex", justifyContent:"space-between"}}>
                            <Form.Item label="Width" name="width">
                                <AntInput placeholder="Enter width" />
                            </Form.Item>

                            <Form.Item label="Height" name="height">
                                <AntInput placeholder="Enter height" />
                            </Form.Item>
                        </div>

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
