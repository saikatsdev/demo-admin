import {ArrowLeftOutlined,DeleteOutlined,LoadingOutlined,PlusOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Form,Select,Space,Switch,message} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";


export default function EditSection() {
    // Hook
    useTitle("Edit Section");

    // Variable
    const navigate = useNavigate();
    const [form]   = Form.useForm();
    const { id }   = useParams();

    // State
    const [isCategory, setIsCategory]                 = useState(false);
    const [isCustom, setIsCustom]                     = useState(false);
    const [categories, setCategories]                 = useState([]);
    const [query, setQuery]                           = useState();
    const [results, setResults]                       = useState([]);
    const [loadingIndex, setLoadingIndex]             = useState(null);
    const [loadingRemoveIndex, setLoadingRemoveIndex] = useState(null);
    const [productIds, setProductIds]                 = useState([]);
    const [messageApi, contextHolder]                 = message.useMessage();
    const [addProducts, setAddProducts]               = useState([]);
    const [loading, setLoading]                       = useState(false);

    // Method
    useEffect(() => {
        const fetchedSingleData = async () => {
        const res = await getDatas(`/admin/sections/${id}`);

            if (res?.success) {
                const list = res?.result || [];
                form.setFieldsValue({
                    title    : list.title,
                    position : list.position,
                    link     : list.link,
                    status   : list.status,
                    is_slider: list.status === "active" ? 1: 0,
                });

                if (list.products.length > 0) {
                    setIsCustom(true);
                    setAddProducts(list.products);

                    const ids = list.products.map((p) => p.id);
                    setProductIds(ids);
                }
            }
        };

        fetchedSingleData();
    }, [id, form]);

    useEffect(() => {
        const fetcheCatgeories = async () => {
            const res = await getDatas("/admin/categories");

            const list = res?.result?.data || [];

            setCategories(list.map((cat) => ({label: cat.name,value: cat.id})));
        };

        fetcheCatgeories();
    }, []);

    useEffect(() => {
        if (!query) return;

        const delayDebouncFn = setTimeout(() => {
            fetchSearchProduct(query);
        }, 500);

        return () => clearTimeout(delayDebouncFn);
    }, [query]);

    const fetchSearchProduct = async (searchText) => {
        const res = await getDatas(`/admin/products/list?search_key=${searchText}`);

        if (res?.success) {
            setResults(res?.result || []);
        }
    };

    const handleAdd = (item, index) => {
        setLoadingIndex(index);
        setProductIds((prev) => [...prev, item.id]);
        setAddProducts((prev) => [...prev, item]);
        setTimeout(() => setLoadingIndex(null), 500);
    };

    const handleRemove = (item, index) => {
        setLoadingRemoveIndex(index);

        setProductIds((prev) => prev.filter((id) => id !== item.id));

        setAddProducts((prev) => prev.filter((p) => p.id !== item.id));

        setTimeout(() => setLoadingRemoveIndex(null), 500);
    };

    const handleSubmit = async (values) => {
        const payload = {
            ...values,
            is_slider  : values.is_slider,
            position   : 5,
            product_ids: productIds,
            _method    : "PUT",
        };

        try {
            setLoading(true);
            const res = await postData(`/admin/sections/${id}`, payload);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/section-list");
                }, 500);
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
                    <h1 className="title">Edit Section</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Section" },
                        ]}
                    />
                </div>
            </div>

            <div className="common-bg">
                <div className="common-bg-flex">
                    <div></div>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
                        Back
                        </Button>
                    </Space>
                </div>

                <div style={{ display: "flex" }}>
                    <div style={{ width: "45%" }}>
                        <Form.Item style={{ fontWeight: "600" }} label="Show Category Products" valuePropName="checked">
                            <Switch checked={isCategory} onChange={(checked) => {setIsCategory(checked);if (checked) {setIsCustom(false);setResults();}}}/>
                        </Form.Item>
                    </div>

                    <div style={{ width: "45%" }}>
                        <Form.Item label="Show Custom Products" style={{ fontWeight: "600" }} valuePropName="checked">
                            <Switch checked={isCustom} onChange={(checked) => {setIsCustom(checked);if (checked) {setIsCategory(false)}}}/>
                        </Form.Item>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ width: "45%" }}>
                                <Form.Item name="title" label="Section Title" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter title" />
                                </Form.Item>
                            </div>

                            <div style={{ width: "45%" }}>
                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: "active", label: "Active" },{ value: "inactive", label: "Inactive" }]}/>
                                </Form.Item>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ width: "45%" }}>
                                <Form.Item name="is_slider" label="Is Slider" rules={[{ required: true }]} initialValue={0}>
                                    <Select options={[{ value: 1, label: "Active" },{ value: 0, label: "Inactive" }]}/>
                                </Form.Item>
                            </div>

                            <div style={{ width: "45%" }}>
                                <Form.Item name="link" label="Section Link" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter link" />
                                </Form.Item>
                            </div>

                            {isCategory && (
                                <div style={{ width: "45%" }}>
                                    <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
                                        <Select options={categories} />
                                    </Form.Item>
                                </div>
                            )}

                            {isCustom && (
                                <div style={{ width: "45%" }}>
                                    <Form.Item label="Search Products" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Search Key" value={query} onChange={(e) => setQuery(e.target.value)}/>
                                    </Form.Item>
                                </div>
                            )}
                        </div>

                        {addProducts && addProducts.length > 0 && (
                            <div className="add-product-box">
                                {addProducts.map((item, index) => (
                                    <div className="add-product-item-list" key={item?.id}>
                                        <div>
                                            <img className="add-product-box-img" src={item?.img_path ? item?.img_path : item?.image} alt={item?.slug}/>

                                            <h2 className="add-product-box-h2">
                                                {item?.name}
                                            </h2>

                                            <p className="add-product-box-p">
                                                Category : {item?.category?.name}
                                            </p>

                                            <p className="add-product-box-p1">
                                                Sku : {item.sku}
                                            </p>

                                            <div className="result-product-list-display">
                                                <span>
                                                    {item?.mrp} tk
                                                </span>
                                                <span className="result-product-list-another-span">
                                                    {item?.sell_price} tk
                                                </span>
                                            </div>

                                            <div className="product-details-ss-display">
                                                <Button color="danger" variant="solid" onClick={() => handleRemove(item, index)}>
                                                    {loadingRemoveIndex === index ? (<LoadingOutlined />) : (<DeleteOutlined />)}
                                                    {loadingRemoveIndex === index ? " Loading..." : " Remove"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {addProducts && addProducts.length > 0 && <hr />}

                        {results && results.length > 0 && (
                            <div className="result-product-list-display-ss">
                                {results.map((item, index) => (
                                    <div className="result-product-list-item-ss" key={item?.id}>
                                        <div>
                                            <img className="result-product-list-img-ss" src={item?.img_path} alt={item?.slug}/>
                                            <h2 className="result-product-list-h2-sss">
                                                {item?.name}
                                            </h2>

                                            <p className="result-product-list-p-sss">
                                                Category : {item?.category.name}
                                            </p>
                                            <p className="result-product-list-p1-sss">
                                                Sku : {item?.sku}
                                            </p>
                                            <div className="s4-pro-dis">
                                                <span className="s4-pro-dis-span">
                                                {item?.mrp} tk
                                                </span>
                                                <span className="s4-pro-dis-span1">
                                                {item?.sell_price} tk
                                                </span>
                                            </div>

                                            <div className="s5-pro-dis">
                                                <Button type="primary" onClick={() => handleAdd(item, index)}>
                                                    {loadingIndex === index ? (<LoadingOutlined />) : (<PlusOutlined />)}
                                                    {loadingIndex === index ? " Loading..." : " Add"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Form.Item style={{ textAlign: "right" }}>
                            <Button type="primary" htmlType="submit">
                                {loading ? "Updating..." : "Update Section"}
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
