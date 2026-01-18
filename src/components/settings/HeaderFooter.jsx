import { CloudUploadOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function HeaderFooter({formatText}) {
    // State
    const [preview, setPreview]                         = useState(null);
    const [headerFooterSetting, setHeaderFooterSetting] = useState([]);
    const [messageApi, contextHolder]                   = message.useMessage();
    const [loading, setLoading]                         = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchedProductSetting = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:4});

            const data = res?.result?.data || [];

            if (isMounted) {
                setHeaderFooterSetting(data);
            }
        };

        fetchedProductSetting();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleInputChange = (id, newValue) => {
        setHeaderFooterSetting((prev) => prev.map((item) => (item.id === id ? { ...item, value: newValue } : item)));
    };

    const filteredHeaderFooterData = headerFooterSetting.filter((item) => item.category?.id == 4);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            items: filteredHeaderFooterData.map((item) => ({
                key                : item.key,
                type               : item.type || "text",
                value              : item.value ?? null,
                setting_category_id: item.category?.id || null,
                instruction        : item.instruction || null,
            })),
        };

        try {
            setLoading(true);
            const res = await postData("/admin/settings", payload);

            if (res?.success) {
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
    };

    const handleToggle = (id, checked) => {
        setHeaderFooterSetting((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, value: checked ? "1" : "0" } : item
            )
        );
    };

    return (
        <>
            {contextHolder}
            <form onSubmit={handleSubmit}>
                <table className="setting-table">
                    <tbody>
                        {filteredHeaderFooterData.map((product, index) => (
                            product.key && (
                            <tr key={index} className="tr-card">
                                    <th className="setting-table-label">{ formatText(product.key)}</th>
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
                                                                <input type="file" accept="image/*" src={preview?.favicon || product.value} onChange={(e) => handleFileChange(e, 'favicon')}/>
                                                            </label>
                                                        </div>

                                                        <div style={{marginTop:"10px", marginLeft:"10px", display:"flex", gap:"10px"}}>
                                                            <div>
                                                                <label style={{color:"#000"}} htmlFor="width">Width</label> <br />
                                                                <input type="text" className="custom-input-logo" placeholder="Width"/>
                                                            </div>

                                                            <div>
                                                                <label style={{color:"#000"}} htmlFor="width">Height</label> <br />
                                                                <input type="text" className="custom-input-logo" placeholder="Height"/>
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

                <div style={{ textAlign: "right" }}>
                    <button className="update-btn">
                        {loading ? "Updating..." : "Update"}
                    </button>
                </div>
            </form>
        </>
    )
}
