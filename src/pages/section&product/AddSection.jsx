import { ArrowLeftOutlined, DeleteOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, Switch, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function AddSection() {
    // Hook
    useTitle("Add Section");

    // Varibale
    const [form] = Form.useForm();
    const navigate = useNavigate();

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

    // Method
    useEffect(() => {
        const fetcheCatgeories = async () => {
            const res = await getDatas("/admin/categories");

            const list = res?.result?.data || [];

            setCategories(
                list.map((cat) => ({
                    label: cat.name,
                        value: cat.id
                }))
            );
        }

        fetcheCatgeories();
    }, []);

    useEffect(() =>{
        if(!query) return;

        const delayDebouncFn = setTimeout(() => {
            fetchSearchProduct(query);
        }, 500);

        return () => clearTimeout(delayDebouncFn);
    }, [query]);

    const fetchSearchProduct = async (searchText) => {
        const res = await getDatas("/admin/products/search",{search_key :searchText});

        if(res?.success){
            setResults(res?.result || []);
        }
    }

    const handleAdd = (item, index) => {
        setLoadingIndex(index);
        setProductIds((prev) => [...prev, item.id]);
        setAddProducts((prev) => [...prev, item]);
        setTimeout(() => setLoadingIndex(null), 500);
    };

    const handleRemove = (item, index) => {
        setLoadingRemoveIndex(index);

        // remove from productIds
        setProductIds((prev) => prev.filter((id) => id !== item.id));

        // remove from addProducts
        setAddProducts((prev) => prev.filter((p) => p.id !== item.id));

        setTimeout(() => setLoadingRemoveIndex(null), 500);
    };


    const handleSubmit = async (values) => {
        const payload = {
            ...values,
            position: 5,
            product_ids : productIds
        }

        const res = await postData("/admin/sections", payload);

        if(res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            setTimeout(() => {
                navigate("/section-list");
            }, 400);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Section</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Section" },
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

            <div style={{background:"#fff", padding:"5px 8px 5px", borderRadius:"4px", boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.24)"}}>
                <div style={{display:"flex"}}>
                    <div style={{width:"45%"}}>
                        <Form.Item style={{fontWeight:"600"}} label="Show Category Products" valuePropName="checked">
                            <Switch  checked={isCategory} onChange={(checked) => {
                                setIsCategory(checked);
                                if(checked) {
                                    setIsCustom(false);
                                    setResults();
                                }
                            }}/>
                        </Form.Item>
                    </div>

                    <div style={{width:"45%"}}>
                        <Form.Item label="Show Custom Products" style={{fontWeight:"600"}} valuePropName="checked">
                            <Switch checked={isCustom} onChange={(checked) => {
                                setIsCustom(checked);
                                if(checked) {
                                    setIsCategory(false)
                                };
                            }}/>
                        </Form.Item>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div>
                        <div style={{display:"flex", gap:"16px"}}>
                            <div style={{width:"45%"}}>
                                <Form.Item name="title" label="Section Title" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter title" />
                                </Form.Item>
                            </div>

                            <div style={{width:"45%"}}>
                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                </Form.Item>
                            </div>
                        </div>

                        <div style={{display:"flex", gap:"16px"}}>
                            <div style={{width:"45%"}}>
                                <Form.Item name="" label="Is Slider" rules={[{ required: true }]} initialValue="inactive">
                                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                </Form.Item>
                            </div>

                            <div style={{width:"45%"}}>
                                <Form.Item name="link" label="Section Link" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter link" />
                                </Form.Item>
                            </div>

                            {isCategory && (
                                <div style={{width:"45%"}}>
                                    <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
                                        <Select options={categories} />
                                    </Form.Item>
                                </div>
                            )}
                            
                            {isCustom && (
                                <div style={{width:"45%"}}>
                                    <Form.Item label="Search Products" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Search Key" value={query} onChange={((e) => setQuery(e.target.value))}/>
                                    </Form.Item>
                                </div>
                            )}
                        </div>
                        
                        {addProducts && addProducts.length > 0 && (
                            <div style={{ display: "flex", gap: "15px", flexWrap:"wrap", alignItems:"stretch"}}>
                                {addProducts.map((item, index) => (
                                    <div key={item.id} style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px", width:"15%", height:"100%"}}>
                                        <div>
                                            <img src={item.img_path} alt={item.slug} style={{width:"80%", height:"180px", display:"block", objectFit:"cover", margin:"0 auto"}} />
                                            <h2 style={{textAlign:"center", color:"#000", fontWeight:"600", fontSize:"20px", lineHeight:"25px"}}>{item.name}</h2>

                                            <p style={{textTransform:"capitalize", fontWeight:"600", textAlign:"center", marginBottom:"0"}}>
                                                Category : {item?.category?.name}
                                            </p>
                                            <p style={{textTransform:"capitalize", fontWeight:"600", textAlign:"center"}}>
                                                Sku : {item.sku}
                                            </p>
                                            <div style={{display:"flex", gap:"15px", justifyContent:"space-around", alignItems:"center"}}>
                                                <span style={{textDecoration:"line-through", fontSize:"20px", fontWeight:"600", color:"red"}}>
                                                    {item.mrp} tk
                                                </span>
                                                <span style={{fontSize:"20px", fontWeight:"600", color:"#28a745"}}>
                                                    {item.sell_price} tk
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                                                <Button color="danger" variant="solid" onClick={() => handleRemove(item, index)}>
                                                    {loadingRemoveIndex === index ? (
                                                        <LoadingOutlined />
                                                    ) : (
                                                        <DeleteOutlined />
                                                    )}
                                                    {loadingRemoveIndex === index ? " Loading..." : " Remove"}
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {addProducts && addProducts.length > 0 && (
                            <hr />
                        )}

                        {results && results.length > 0 && (
                            <div style={{ display: "flex", gap: "15px", flexWrap:"wrap", alignItems:"stretch"}}>
                                {results.map((item, index) => (
                                    <div key={item.id} style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px", width:"15%", height:"100%"}}>
                                        <div>
                                            <img src={item.img_path} alt={item.slug} style={{width:"80%", height:"180px", display:"block", objectFit:"cover", margin:"0 auto"}} />
                                            <h2 style={{textAlign:"center", color:"#000", fontWeight:"600", fontSize:"20px", lineHeight:"25px"}}>{item.name}</h2>

                                            <p style={{textTransform:"capitalize", fontWeight:"600", textAlign:"center", marginBottom:"0"}}>
                                                Category : {item?.category?.name}
                                            </p>
                                            <p style={{textTransform:"capitalize", fontWeight:"600", textAlign:"center"}}>
                                                Sku : {item.sku}
                                            </p>
                                            <div style={{display:"flex", gap:"15px", justifyContent:"space-around", alignItems:"center"}}>
                                                <span style={{textDecoration:"line-through", fontSize:"20px", fontWeight:"600", color:"red"}}>
                                                    {item.mrp} tk
                                                </span>
                                                <span style={{fontSize:"20px", fontWeight:"600", color:"#28a745"}}>
                                                    {item.sell_price} tk
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                                                <Button type="primary" onClick={() => handleAdd(item, index)}>
                                                    {loadingIndex === index ? (
                                                        <LoadingOutlined />
                                                    ) : (
                                                        <PlusOutlined />
                                                    )}
                                                    {loadingIndex === index ? " Loading..." : " Add"}
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Form.Item style={{textAlign:"right"}}>
                            <Button type="primary" htmlType="submit">
                                Add Section
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </>
    )
}
