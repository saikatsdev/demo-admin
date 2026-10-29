import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import { Breadcrumb, Button } from "antd";
import { Link } from "react-router-dom";
import LeaveWorkspace from "../../../../components/dashboard/LeaveWorkspace";
import useTitle from "../../../../hooks/useTitle";
import "./MyLeave.css";

export default function MyLeave() {
    useTitle("My Leave");

    return (
        <div className="my-leave-page">
            <div className="pagehead">
                <div className="head-left">
                    <div className="my-leave-page__title">
                        <CalendarOutlined />
                        <div>
                            <h1 className="title">My Leave</h1>
                            <p>Manage your leave balance, applications, and request history.</p>
                        </div>
                    </div>
                </div>

                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "My Leave" },
                        ]}
                    />
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </div>
            </div>

            <LeaveWorkspace />
        </div>
    );
}
