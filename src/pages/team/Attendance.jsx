import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle"
import { getDatas } from "../../api/common/common";

function Attendance() {
    // Hook
    useTitle("Attendance");

    // States
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState([]);

    // Functions
    const getAttendance = async () => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/attendance");
            setAttendance(res?.result?.data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAttendance();
    }, []);

    return (
        <>

        </>
    )
}

export default Attendance