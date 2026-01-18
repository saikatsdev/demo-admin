import { message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function GeneralSetting({formatText}) {
    // State
    const [generalData, setGeneralData] = useState([]);
    const [messageApi, contextHolder]   = message.useMessage();
    const [loading, setLoading]         = useState(false);

    // Method
    useEffect(() => {
        let isMounted = true;

        const fetcheGeneral = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:1});

            const data = res?.result?.data || [];

            if(isMounted){
                setGeneralData(data);
            }
        }

        fetcheGeneral();
    }, []);

    const handleInputChange = (id, newValue) => {
      setGeneralData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, value: newValue } : item
        )
      );
    };

    const generalSettings = generalData.filter((item) => item.category?.id === 1);

    const handleToggle = (id, checked) => {
      setGeneralData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, value: checked ? "1" : "0" } : item
        )
      );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const filteredData = generalData.filter(item => item.category?.id === 1);

        const payload = {
            items: filteredData.map(item => ({
                key                : item.key,
                type               : item.type || "text",
                value              : item.value ?? null,
                setting_category_id: item.category?.id || null,
                instruction        : item.instruction || null,
            })),
        };

        try {
            setLoading(true);
            const res = await postData("/admin/settings", JSON.stringify(payload));
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        } catch (error) {
            console.error("Error updating settings:", error);
        }finally{
            setLoading(false);
        }
    }

    const handleImageUpload = () => {

    }

    return (
        <>
            {contextHolder}
            <form onSubmit={handleSubmit}>
                <table className="setting-table">
                    <tbody>
                        {generalSettings.map((product, index) => (
                            product.key && (
                            <tr key={index} className="tr-card">
                                <th className="setting-table-label">{formatText(product?.key)}</th>
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
                                                <input className="custom-input" type="file" accept="image/*" onChange={(e) => handleImageUpload(product.id, e.target.files[0])}/>
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
