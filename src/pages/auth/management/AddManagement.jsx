import {Breadcrumb,message, Select } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";

export default function AddManagement() {
    // Hook
    useTitle("Add Management");

    // Variable
    const navigate = useNavigate();

    // State
    const [image, setImage]                     = useState(null);
    const [roleOptions, setRoleOptions]         = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [managerOptions, setManagerOptions]   = useState([]);
    const [messageApi, contextHolder]           = message.useMessage();
    const [selectedRoles, setSelectedRoles]     = useState([]);
    const [preview, setPreview]                 = useState(null);
    const [loading, setLoading]                 = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);

        setPreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
    };

    useEffect(() => {
        let active = true;

        const loadOptions = async () => {
            try {
                const [rolesRes, catsRes, userRes] = await Promise.all([
                    getDatas("/admin/roles"),
                    getDatas("/admin/user-categories"),
                    getDatas("/admin/users")
                ]);

                if (!active) return;

                setManagerOptions(
                    userRes?.result?.data?.map((u) => ({ label: u.username, value: u.id }))
                );

                setRoleOptions(
                    (rolesRes?.result?.data || []).map((r) => ({
                        label: r.display_name || r.name,
                        value: r.id,
                    }))
                );

                setCategoryOptions(
                    (catsRes?.result?.data || []).map((c) => ({
                        label: c.name,
                        value: c.id,
                    }))
                );
            } catch (error) {
                console.error("Error loading options:", error);
            }
        };

        loadOptions();

        return () => {
            active = false;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        const form = e.target;
        const formData = new FormData();
        formData.append("username", form.username.value);
        formData.append("email", form.email.value);
        formData.append("phone_number", form.phone_number.value);
        formData.append("salary", form.salary.value);
        formData.append("password", form.password.value);
        
        selectedRoles.forEach((roleId) => formData.append("role_ids[]", roleId));

        formData.append("manager_id", form.manager_id.value);
        formData.append("user_category_id", form.user_category_id.value);
        formData.append("status", form.status.value);

        if (image) {
            formData.append("image", image);
            formData.append("width", 450);
            formData.append("height", 450);
        }

        try {
            const res = await postData("/admin/users", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if(res && res?.success){
                setLoading(false);
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/management");
                }, 500);
            }
        } catch (error) {
            console.error("Error creating user:", error.response?.data || error.message);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Management</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Management" },
                        ]}
                    />
                </div>
            </div>

            <div className="raw-sell-container">
                <form action="" className="raw-sell-form" onSubmit={handleSubmit}>
                    <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                        <h2 className="page-title">Add Management</h2>

                        <button type="button" className="back-btn" onClick={() => window.history.back()} aria-label="Go back" title="Go back">
                            <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                                <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="label">Back</span>
                        </button>
                    </div>

                    <div className="row">
                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Name:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter user name" name="username"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Phone Number:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter phone number" name="phone_number"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Salary:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter salary" name="salary"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Email:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter email" name="email"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Password:</label>
                                <input type="password" className="raw-sell-input" placeholder="Enter password" name="password"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">User Role:</label>
                                <Select mode="multiple" allowClear placeholder="Select Role" className="raw-sell-select" style={{ width: "100%" }}
                                    value={selectedRoles} onChange={(value) => setSelectedRoles(value)} options={roleOptions}
                                />
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Manager:</label>
                                <select name="manager_id" id="" className="raw-sell-select">
                                    <option value="" selected disabled>Select Manager</option>
                                    {managerOptions.length > 0 && (
                                        managerOptions.map((item) => (
                                            <option value={item.value} key={item.value}>{item.label}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">User Category:</label>
                                <select name="user_category_id" id="" className="raw-sell-select">
                                    <option value="" selected disabled>Select Category</option>
                                    {categoryOptions.length > 0 && (
                                        categoryOptions.map((item) => (
                                            <option value={item.value} key={item.value}>{item.label}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Status:</label>
                                <select name="status" id="" className="raw-sell-select">
                                    <option value="" selected disabled>Select Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">In Active</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Image:</label>
                                <div className="image-upload-wrapper">
                                    {!preview ? (
                                        <label className="upload-box">
                                            <input type="file" name="image" accept="image/*" onChange={handleImageChange}/>
                                            <span>Select Image</span>
                                        </label>
                                    ) : (
                                        <div className="preview-box">
                                            <img src={preview} alt="preview" />
                                            <button type="button" className="remove-btn" onClick={removeImage}>
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="raw-sell-submit">
                                <button type="submit" className="raw-sell-btn">
                                    {loading ? "Creating..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}
