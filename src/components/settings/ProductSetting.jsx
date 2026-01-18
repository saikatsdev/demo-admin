import { CloudUploadOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function ProductSetting({formatText}) {
    // State
    const [productSetting, setProductSetting] = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();
    const [loading, setLoading]               = useState(false);

    // Method
    useEffect(() => {
        let isMounted = true;

        const fetchedProductSetting = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:3});

            const data = res?.result?.data || [];

            if(isMounted){
                setProductSetting(data);
            }
        }

        fetchedProductSetting();

        return () => {
            isMounted = false;
        }
    }, []);

    const filteredProductdata = productSetting.filter((item) => item.category?.id == 3);

    const handleToggle = (id, checked) => {
        setProductSetting((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, value: checked ? "1" : "0" } : item
            )
        );
    };

    const handleInputChange = (id, newValue) => {
        setProductSetting((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, value: newValue } : item
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const items = filteredProductdata.map((item) => ({
            key                : item.key,
            type               : item.type,
            value              : item.value,
            setting_category_id: item.category?.id ?? 3,
            instruction        : item.instruction || null,
        }));

        try {
            setLoading(true);
            const res = await postData("/admin/settings", { items });

            if (res && res?.success === true) {
                messageApi.open({
                  type: "success",
                  content: res.msg,
                });
            } else {
                console.error("❌ Update failed:", res);
            }
        } catch (error) {
            console.error("⚠️ Error submitting settings:", error);
        }finally{
            setLoading(false);
        }
    }

    const handleFileChange = () => {
        
    }

    return (
        <>
            {contextHolder}
            <form onSubmit={handleSubmit}>
                <table className="setting-table">
                    <tbody>
                        {filteredProductdata.map((product, index) => (
                            product.key && (
                           <tr key={index} className="tr-card">
                                <th className="setting-table-label">{formatText(product.key)}</th>
                                <th className="setting-table-separator">:</th>
                                <td className="setting-table-value">
                                    {(() => {
                                        switch (product.type) {
                                        case "switch-button":
                                            return (
                                                <label className="switch">
                                                    <input type="checkbox" checked={product.value === "1"} onChange={(e) => handleToggle(product.id, e.target.checked)}/>
                                                    <span className="slider"></span>
                                                </label>
                                            );

                                        case "boolean":
                                            return (
                                                <label className="switch">
                                                    <input type="checkbox" checked={product.value === "1"} onChange={(e) => handleToggle(product.id, e.target.checked)}/>
                                                    <span className="slider"></span>
                                                </label>
                                            );

                                        case "input":
                                            return (
                                                <input className="custom-input" type="text" name={product.key} value={product.value || ""} onChange={(e) => handleInputChange(product.id, e.target.value)}/>
                                            );

                                        case "description":
                                            return (
                                                <textarea className="custom-input" name={product.key} value={product.value || ""} onChange={(e) => handleInputChange(product.id, e.target.value)}/>
                                            );

                                        case "image":
                                            return (
                                                <>
                                                    <div className="setting-logo">
                                                        <img src={product.value} alt="Favicon" />
                                                        <label className="upload-btn">
                                                            <CloudUploadOutlined />
                                                            <input type="file" accept="image/*" src={product.value} onChange={(e) => handleFileChange(e, 'favicon')}/>
                                                        </label>
                                                    </div>

                                                    <div style={{marginTop:"10px", marginLeft:"10px", display:"flex", gap:"10px"}}>
                                                        <div>
                                                            <label style={{color:"#000"}} htmlFor="width">Width</label> <br />
                                                            <input type="text" placeholder="Width"/>
                                                        </div>

                                                        <div>
                                                            <label style={{color:"#000"}} htmlFor="width">Height</label> <br />
                                                            <input type="text" placeholder="Height"/>
                                                        </div>
                                                    </div>
                                                </>
                                            );

                                        default:
                                            return (
                                                <span style={{ color: "gray" }}>
                                                    Unsupported Type: {product.type}
                                                </span>
                                            );
                                        }
                                    })()}
                                </td>

                               <td className="setting-table-value">
                                    <p className="setting-table-text ">
                                        {product.instruction}
                                    </p>
                                </td>
                            </tr>
                            )
                        ))}
                    </tbody>
                </table>

                <div style={{textAlign:"right"}}>
                    <button className="update-btn">
                        {loading ? "Updating..." : "Update"}
                    </button>
                </div>
            </form>
        </>
    )
}
