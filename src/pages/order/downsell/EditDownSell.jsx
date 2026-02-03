import useTitle from "../../../hooks/useTitle"
import {Breadcrumb, message, Spin} from "antd";
import {BackwardOutlined} from '@ant-design/icons';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getDatas, postData } from "../../../api/common/common";
import axios from "axios";
import "./downsell.css";

export default function EditDownSell() {
    // Hook
    useTitle("Edit Down Sell");

    // State
    const [query, setQuery]                           = useState("");
    const [results, setResults]                       = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [selectedProducts, setSelectedProducts]     = useState([]);
    const [image, setImage]                           = useState(null);
    const [categories, setCategories]                 = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [imageFile, setImageFile]                   = useState(null);
    const [mode, setMode]                             = useState("all");
    const [messageApi, contextHolder]                 = message.useMessage();
    const [downSellData, setDownSellData] = useState({title: "",amount: "",duration: "",type: "fixed",started_at: "",ended_at: "",status: "active",description: "",width: 200,height: 200});


    // Variable
    const {id}            = useParams();
    const debounceTimeout = useRef(null);
    const cancelToken     = useRef(null);
    const navigate        = useNavigate();

    // Get Category
    useEffect(() => {
        let isMounted = true;

        const getCategories = async () => {
            const res =  await getDatas("/admin/categories/list");

            if(res && res.success){
                if(isMounted){
                    setCategories(res?.result || []);
                }
            }
        }

        getCategories();

        return () => {
            isMounted = false;
        }
    }, []);

    // Get DownSell
    useEffect(() => {
        let isMounted = true;

        setLoading(true);
        const getDownSell = async () => {
            const res = await getDatas(`/admin/down-sells/${id}`);

            if(res && res?.success){
                if(isMounted){
                    const data = res.result;

                    setDownSellData(data);
                    setImage(data.image);

                    if (data.is_all == 1) {
                        setMode("all");
                    } else {
                        setMode("product");
                    }

                    if (Array.isArray(data.products) && data.products.length > 0) {
                        const formattedProducts = data.products.map(item => ({
                            id         : item.id,
                            name       : item.name,
                            img_path   : item.img_path,
                            offer_price: item.offer_price,
                            category   : item.category ?? { name: "N/A" }
                        }));

                        setSelectedProducts(formattedProducts);
                    }
                }
                setLoading(false);
            }
        }

        getDownSell();

        return () => {
            isMounted = false;
        }
    }, [id]);

    useEffect(() => {
        if (downSellData &&  downSellData.category_id !== null &&  categories.length > 0) {
            const foundCat = categories.find((cat) => cat.id === downSellData.category_id);

            if (foundCat) {
                setSelectedCategories([foundCat]);
            }
        }
    }, [downSellData, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setDownSellData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
            setImageFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImageFile(null);
    };

    // For Product Search
    const fetchedProducts = async (searchTerm) => {
        if(!searchTerm){
            setResults([]);
            return;
        }

        if (cancelToken.current) {
            cancelToken.current.cancel("Operation canceled due to new request");
        }

        cancelToken.current = axios.CancelToken.source();

        setLoading(true);

        try {
            const res = await getDatas("/admin/products/search", {search_key : searchTerm});

            if(res && res?.success){
                setResults(res?.result);
            }
        } catch (error) {
            console.log("Something went wrong", error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {fetchedProducts(query);}, 400);

        return () => clearTimeout(debounceTimeout.current);
    }, [query]);

    const handleSelect = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts([...selectedProducts, product]);
        }
    }

    const handleCategory = (categoryId) => {
        if (!categoryId) return;

        const category = categories.find((cat) => cat.id === parseInt(categoryId));

        if (category && !selectedCategories.find((c) => c.id === category.id)) {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        formData.append("mode", mode);

        if (mode === "product") {
            selectedProducts.forEach(p => {
                formData.append("product_ids[]", p.id);
            });
        }

        if (mode === "category") {
            selectedCategories.forEach(c => {
                formData.append("category_ids[]", c.id);
            });
        }

        if (imageFile) formData.append("image", imageFile);

        formData.append("_method", "PUT");

        try {
            setLoading(true);

            const res = await postData(`/admin/down-sells/${id}`, formData, {headers: { "Content-Type": "multipart/form-data" }});
            if(res && res?.success){

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/downsell-coupon");
                }, 500);
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
            <Spin spinning={loading} size="large">
                <div className="pagehead">
                    <div className="head-left">
                        <h1 className="title">Edit Downsell Products</h1>
                    </div>
                    <div className="head-actions">
                        <Breadcrumb
                            items={[
                                { title: <Link to="/dashboard">Dashboard</Link> },
                                { title: "Edit Downsell Products" },
                            ]}
                        />
                    </div>
                </div>

                <div className="raw-sell-container">
                    <form onSubmit={handleSubmit} className="raw-sell-form">
                            <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                                <h2 className="page-title">Edit Downsell Products</h2>

                                <button type="button" className="back-btn" onClick={() => window.history.back()} aria-label="Go back" title="Go back">
                                    <BackwardOutlined />
                                    <span className="label">Back</span>
                                </button>
                            </div>

                            <div className="row">
                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Name:</label>
                                        <input type="text" className="raw-sell-input" placeholder="Enter offer name" value={downSellData?.title} name="title" onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Coupon Amount:</label>
                                        <input type="number" className="raw-sell-input" placeholder="Enter amount" value={downSellData?.amount} name="amount" onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Duration (days):</label>
                                        <input type="number" className="raw-sell-input" placeholder="Enter offer name" value={downSellData?.duration} name="duration" onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Coupon Type:</label>
                                        <select name="coupon_type" className="raw-sell-input" value={downSellData?.type} onChange={handleChange}>
                                            <option value="fixed">Fixed Amount</option>
                                            <option value="percent">Percent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Start Date :</label>
                                        <input type="date" className="raw-sell-input" name="started_at" value={downSellData?.started_at?.slice(0, 10) || ""} onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">End Date :</label>
                                        <input type="date" className="raw-sell-input" name="ended_at" value={downSellData?.ended_at?.slice(0, 10) || ""} onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Status:</label>
                                        <select name="status" className="raw-sell-input" value={downSellData?.status} onChange={handleChange}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Description:</label>
                                        <textarea name="description" className="raw-sell-input" placeholder="Enter description" value={downSellData?.description || ""} onChange={handleChange}></textarea>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Image:</label>
                                        {!image && (
                                            <label className="custom-upload">
                                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                                <span>Choose Image</span>
                                            </label>
                                            )}

                                            {image && (
                                            <div className="image-preview">
                                                <img src={image} alt="preview" />
                                                <button className="remove-btn" onClick={removeImage}>
                                                    &times;
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Width:</label>
                                        <input type="number" name="width" value={downSellData?.width} className="raw-sell-input" placeholder="Enter width" onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-lg-6 col-12">
                                    <div className="raw-sell-row">
                                        <label className="raw-sell-label">Height:</label>
                                        <input type="number" name="height" value={downSellData?.height} className="raw-sell-input" placeholder="Enter height" onChange={handleChange}/>
                                    </div>
                                </div>

                                <div className="col-12 mb-3">
                                <div className="raw-radio-main">
                                    <label className="raw-sell-label d-block mb-2">Select Trigger Mode:</label>
                                    <div className="raw-sell-radio-group">
                                        <label className={`${mode === 'all' ? 'active' : ''}`}>
                                        <input type="radio" name="trigger_mode" value="all" checked={mode === 'all'} onChange={(e) => setMode(e.target.value)}/>
                                            For All Products
                                        </label>

                                        <label className={`${mode === 'product' ? 'active' : ''}`}>
                                        <input type="radio" name="trigger_mode" value="product" checked={mode === 'product'} onChange={(e) => setMode(e.target.value)}/>
                                            For Specific Products
                                        </label>

                                        <label className={`${mode === 'category' ? 'active' : ''}`}>
                                        <input type="radio" name="trigger_mode" value="category" checked={mode === 'category'} onChange={(e) => setMode(e.target.value)}/>
                                            For Specific Category
                                        </label>
                                    </div>
                                </div>
                                </div>

                                {mode === "product" && (
                                    <div className="col-lg-6 col-12">
                                        <div className="raw-sell-row">
                                            <label className="raw-sell-label">Search Product:</label>
                                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} className="raw-sell-input" placeholder="Enter product name..." />

                                            {query && (
                                                <div className="downsell-search-box">
                                                    {loading ? (
                                                        <div className="search-loading">Searching...</div>
                                                    ): results.length > 0 ? (
                                                        results.map((item) => (
                                                            <div className="downsell-result-item" key={item.id} onClick={() => handleSelect(item)}>
                                                                <img src={item.img_path} alt={item.name} />
                                                                <span className="product-name">{item.name}</span>
                                                                <span className="product-category">{item.category.name}</span>
                                                                <span className="product-price">{item.offer_price} BDT</span>
                                                            </div>
                                                        ))
                                                    ): (
                                                        <div className="no-result">No product found</div>
                                                    )}
                                                </div>
                                            )}

                                            {selectedProducts.length > 0 && (
                                                <div className="downsell-selected-products">
                                                    <h5>Selected Products:</h5>
                                                    {selectedProducts.map((item) => (
                                                    <div className="downsell-result-item selected" key={item.id}>
                                                        <img src={item.img_path} alt={item.name} />
                                                        <span className="product-name">{item.name}</span>
                                                        <span className="product-category">{item.category.name}</span>
                                                        <span className="product-price">{item.offer_price} BDT</span>
                                                        <button onClick={() => setSelectedProducts(selectedProducts.filter((p) => p.id !== item.id))} className="remove-btn">
                                                            &times;
                                                        </button>
                                                    </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {mode === "category" && (
                                    <div className="col-lg-6 col-12">
                                        <div className="raw-sell-row">
                                            <label className="raw-sell-label">Select Category:</label>
                                            <select name="" className="raw-sell-input" onChange={(e) => handleCategory(e.target.value)}>
                                                <option value="">Select Category</option>

                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {selectedCategories.length > 0 && (
                                                <div className="downsell-selected-categories">
                                                    <h5>Selected Categories:</h5>
                                                    <div className="category-list">
                                                        {selectedCategories.map((cat) => (
                                                            <div className="downsell-category-item" key={cat.id}>
                                                                {cat.name}
                                                                <button className="remove-btn" onClick={() => setSelectedCategories(selectedCategories.filter((c) => c.id !== cat.id))}>
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                                <div className="col-12">
                                    <div className="raw-sell-submit">
                                        <button type="submit" className="raw-sell-btn">
                                            {loading ? "Updating..." : "Update"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </form>
                </div>
            </Spin>
            
        </>
    )
}
