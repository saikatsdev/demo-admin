import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";
import {message} from "antd";

export default function Permalink({slug, setSlug,productId, settings }) {
    // State
    const [isEditing, setIsEditing]           = useState(false);
    const [slugInput, setSlugInput]           = useState("");
    const [isChecking, setIsChecking]         = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isAvailable, setIsAvailable]       = useState(true);
    const [errorMessage, setErrorMessage]     = useState("");
    const [messageApi, contextHolder]         = message.useMessage();

    const baseUrl = `${settings.frontend_base_url}/product/`;

    const checkSlug = async (value) => {
        try {
            setIsChecking(true);
            setErrorMessage("");
            setSuccessMessage("");

            const res = await getDatas("/admin/check/product", { slug: value });

            const available = res?.available === true;

            if (!available) {
                setIsAvailable(false);
                setErrorMessage("Slug already taken");
            } else {
                setIsAvailable(true);
                setSuccessMessage("Available");
            }
        } catch (e) {
            setIsAvailable(false);
            setErrorMessage("Could not verify slug", e);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (!slugInput) return;

        const timeout = setTimeout(() => {
        checkSlug(slugInput);
        }, 300);

        return () => clearTimeout(timeout);
    }, [slugInput]);

    const handleSlugChange = (e) => {
        setSlugInput(e.target.value);
    };

    const handleOk = async () => {
        if (!isAvailable || !slugInput) return;

        try {
            const res = await postData(`/admin/update/product/${productId}`, {
                slug: slugInput,
            });

            const data = res?.result;

            setSlugInput(data.slug);
            setIsEditing(false);
            setSlug(data.slug);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        } catch (e) {
            setErrorMessage("Failed to update slug", e);
        }
    };

    const handleCancel = () => {
        setSlugInput("");
        setIsEditing(false);
    };

    return (
        <>
            {contextHolder}
            <div className="permalink-area">
                <span className="permalink-label">Permalink:&nbsp;</span>

                {!isEditing && (
                    <>
                        <a className="permalink-url" href={`${baseUrl}${slug}/`} target="_blank" rel="noreferrer">{baseUrl}{slug}/</a>

                        <button type="button" className="btn-permalink" value={slugInput} onChange={handleSlugChange} onClick={() => {setIsEditing(true); setSlugInput("")}}>
                            Edit
                        </button>
                    </>
                )}

                {isEditing && (
                    <>
                        <span className="permalink-base">{baseUrl}</span>

                        <input type="text" className="permalink-input" value={slugInput} onChange={handleSlugChange}/>

                        {isChecking && <span className="permalink-check-span">Checking…</span>}

                        {!isAvailable && <span className="permalink-error-span">{errorMessage}</span>}

                        {isAvailable && !isChecking && slugInput && (<span className="permalink-success-span">✓ {successMessage}</span>)}

                        <button type="button" className="btn-permalink btn-permalink-primary" onClick={handleOk} disabled={!isAvailable || !slugInput || isChecking}>
                            OK
                        </button>

                        <button type="button" className="btn-permalink-link" onClick={handleCancel}>
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </>
    )
}
