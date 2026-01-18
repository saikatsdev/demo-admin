import useTitle from "../../hooks/useTitle"

import {Breadcrumb,message, Select } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";

export default function EditCustomer() {
    // Hook
    useTitle("Edit Customer");

    const navigate = useNavigate();
    const {id} = useParams();

    const [image, setImage]                       = useState(null);
    const [preview, setPreview]                   = useState(null);
    const [roleOptions, setRoleOptions]           = useState([]);
    const [categoryOptions, setCategoryOptions]   = useState([]);
    const [managerOptions, setManagerOptions]     = useState([]);
    const [messageApi, contextHolder]             = message.useMessage();
    const [selectedRoles, setSelectedRoles]       = useState([]);
    const [user, setUser]                         = useState({});
    const [selectedCategory, setSelectedCategory] = useState("");
    const [status, setStatus]                     = useState("");
    const [manager, setManager]                   = useState("");

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        let active = true;

        const loadOptions = async () => {
            try {
                const [rolesRes, catsRes, userRes, user] = await Promise.all([
                    getDatas("/admin/roles"),
                    getDatas("/admin/user-categories"),
                    getDatas("/admin/users"),
                    getDatas(`/admin/users/${id}`),
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

                setUser(user?.result);
                setSelectedCategory(user.result.category.id);
                setStatus(user?.result?.status);
                setManager(user?.result?.manager.id);
                setImage(user?.result?.image || null);
                if (user.result.image) {
                    setPreview(user.result.image);
                }
                
                const userRoles = user?.result?.roles?.map(r => r.id) || [];
                
                setSelectedRoles(userRoles);
            } catch (error) {
                console.error("Error loading options:", error);
            }
        };

        loadOptions();

        return () => {
            active = false;
        };
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        if (image instanceof File) {
            formData.append("image", image);
            formData.append("width", 1200);
            formData.append("height", 960);
        }

        formData.append("_method", "PUT");

        try {
            const res = await postData(`/admin/users/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/customer");
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
                    <h1 className="title">Edit Customer</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Edit Customer" },
                        ]}
                    />
                </div>
            </div>

            <div className="raw-sell-container">
                <form action="" className="raw-sell-form" onSubmit={handleSubmit}>
                    <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                        <h2 className="page-title">Edit Customer</h2>

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
                                <input type="text" className="raw-sell-input" placeholder="Enter user name" value={user?.username || ""} onChange={(e) => setUser({...user, username: e.target.value})} name="username"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Phone Number:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter phone number" name="phone_number" value={user?.phone_number || ""} onChange={(e) => setUser({...user, phone_number: e.target.value})}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Salary:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter salary" name="salary" value={user?.salary} onChange={(e) => setUser({...user, salary:e.target.value})}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Email:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter email" name="email" value={user?.email} onChange={(e) => setUser({...user, email:e.target.value})}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Password:</label>
                                <input type="password" className="raw-sell-input" placeholder="Enter password" name="password" value={user?.password || ""} onChange={(e) => setUser({...user, password:e.target.value})}/>
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
                                <select name="manager_id" className="raw-sell-select" value={manager} onChange={(e) => setManager(e.target.value)}>
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
                                <select name="user_category_id" className="raw-sell-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
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
                                <select name="status" className="raw-sell-select" value={status} onChange={(e) => setStatus(e.target.value)}>
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
                                            <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
                                            <span>Select Image</span>
                                        </label>
                                    ) : (
                                        <div className="preview-box">
                                            <img src={preview} alt="preview" />
                                            <button type="button" className="remove-btn" onClick={() => { setImage(null); setPreview(null); }}>Remove</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="raw-sell-submit">
                                <button type="submit" className="raw-sell-btn">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}
