import { CloudUploadOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function Logo({ formatText }) {
    // State
    const [logoData, setLogoData]     = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [files, setFiles]           = useState({favicon: null,header: null,footer: null});
    const [previews, setPreviews]     = useState({favicon: null,header: null,footer: null});
    const [imageSizes, setImageSizes] = useState({});
    const [loading, setLoading]       = useState(false);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];

        if (file) {
            setFiles((prev) => ({ ...prev, [type]: file }));

            const reader = new FileReader();
            reader.onload = () => {
                setPreviews((prev) => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchLogoData = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:2});
            const data = res?.result?.data || [];

            if (isMounted) {
                setLogoData(data);

                // store sizes
                data.forEach((item) => {
                    if (item.type === "image") {
                        setImageSizes((prev) => ({
                        ...prev,
                            [item.key]: {
                                width: item.width || 200,
                                height: item.height || 200,
                            },
                        }));
                    }
                });
            }
        };

        fetchLogoData();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredLogoData = logoData.filter((item) => item.category?.id == 2);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        const logoKeys = {favicon_icon: "favicon_icon",header_logo: "header_logo",footer_logo: "footer_logo"};

        const selectedTypes = ["favicon_icon", "header_logo", "footer_logo"];

        selectedTypes.forEach((type, index) => {
            const logo = filteredLogoData.find((item) => item.key === logoKeys[type]);
            const file = files[type];

            if (logo && file) {
                formData.append(`items[${index}][key]`, logo.key);
                formData.append(`items[${index}][type]`, "image");
                formData.append(`items[${index}][value]`, file);
                formData.append(`items[${index}][setting_category_id]`,logo.category?.id ?? 2);

                formData.append(`items[${index}][width]`,imageSizes[logo.key]?.width || logo.width || 200);
                formData.append(`items[${index}][height]`,imageSizes[logo.key]?.height || logo.height || 200);

                formData.append(`items[${index}][instruction]`, logo.instruction);
            }
        });

        try {
            setLoading(true);
            const res = await postData("/admin/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res && res?.success === true) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            } else {
                console.error("Upload failed:", res);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }finally{
            setLoading(false);
        }
    };

    const handleToggle = (id, checked) => {
        setLogoData((prev) =>
            prev.map((item) => item.id === id ? { ...item, value: checked ? "1" : "0" } : item)
        );
    };

    const handleInputChange = (id, newValue) => {
        setLogoData((prev) => prev.map((item) => (item.id === id ? { ...item, value: newValue } : item)));
    };

    const handleSizeChange = (key, field, value) => {
        setImageSizes((prev) => ({...prev,[key]: {...prev[key],[field]: value,},}));
    };

    return (
        <>
            {contextHolder}

            <form onSubmit={handleSubmit}>
                <table className="setting-table">
                    <tbody>
                        {filteredLogoData.map(
                        (product, index) =>
                            product.key && (
                                <tr key={index} className="tr-card">
                                    <th className="setting-table-label">
                                        {formatText(product.key)}
                                    </th>
                                    <th className="setting-table-separator">:</th>

                                    <td className="setting-table-value">
                                        {(() => {
                                            switch (product.type) {
                                                case "switch-button":
                                                case "boolean":
                                                    return (
                                                        <label className="switch">
                                                            <input type="checkbox" checked={product.value === "1"} onChange={(e) => handleToggle(product.id, e.target.checked)}/>
                                                            <span className="slider"></span>
                                                        </label>
                                                    );

                                                case "input":
                                                    return (
                                                        <input className="custom-input" type="text" value={product.value || ""} onChange={(e) => handleInputChange(product.id, e.target.value)}/>
                                                    );

                                                case "description":
                                                    return (
                                                        <textarea className="custom-input" value={product.value || ""} onChange={(e) => handleInputChange(product.id, e.target.value)}/>
                                                    );

                                                case "image":
                                                    return (
                                                        <>
                                                            <div className="setting-logo">
                                                                <img src={previews[product.key] || product.value} alt={product.key} style={{maxWidth: "200px",height: "auto",objectFit: "contain"}}/>

                                                                <label className="upload-btn">
                                                                    <CloudUploadOutlined />
                                                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, product.key)}/>
                                                                </label>
                                                            </div>

                                                            <div style={{marginTop: "10px",marginLeft: "10px",display: "flex",gap: "10px"}}>
                                                                <div>
                                                                    <label style={{ color: "#000" }}>
                                                                        Width
                                                                    </label>
                                                                    <br />
                                                                    <input type="text" placeholder="Width" value={imageSizes[product.key]?.width ?? 200} onChange={(e) =>handleSizeChange(product.key,"width",e.target.value)} className="custom-input-logo"/>
                                                                </div>

                                                                <div>
                                                                    <label style={{ color: "#000" }}>
                                                                        Height
                                                                    </label>
                                                                    <br />
                                                                    <input type="text" placeholder="Height" value={imageSizes[product.key]?.height ?? 200} onChange={(e) => handleSizeChange(product.key,"height",e.target.value)} className="custom-input-logo"/>
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
                                        <p className="setting-table-text">
                                            {product.instruction}
                                        </p>
                                    </td>
                                </tr>
                            )
                        )}
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
