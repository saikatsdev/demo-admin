import { Button, Form, Input, Progress, Empty } from "antd";
import { useMemo, useState } from "react";
import useTitle from "../../../hooks/useTitle";
import { getDatas } from "../../../api/common/common";
import "./css/fraud-check.css";
import { formatCourierData } from "../../../helpers/courier.helper";

export default function FraudCheck() {
  useTitle("Fraud Checker");

  const [courierData, setCourierData] = useState(null);
  const [courierList, setCourierList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedPhone, setSearchedPhone] = useState("");
  const [form] = Form.useForm();

  const handleCheck = async (values) => {
    const phoneNumber = String(values.phone_number || "").trim();
    if (!phoneNumber) return;

    try {
      setLoading(true);
      setSearchedPhone(phoneNumber);

      const res = await getDatas("/admin/orders/courier/delivery/report", {
        phone_number: phoneNumber,
      });

      if (res?.success) {
        const report = res?.result?.courier_delivery_report || {};
        setCourierData(report?.summary || null);
        setCourierList(formatCourierData(report));
      } else {
        setCourierData(null);
        setCourierList([]);
      }
    } catch (error) {
      console.error(error);
      setCourierData(null);
      setCourierList([]);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const totalOrders = courierList.reduce(
      (sum, i) => sum + Number(i.total_parcels || 0),
      0
    );
    const totalDelivered = courierList.reduce(
      (sum, i) => sum + Number(i.delivered_parcels || 0),
      0
    );
    const totalCanceled = courierList.reduce(
      (sum, i) => sum + Number(i.canceled_parcels || 0),
      0
    );

    const overallSuccess =
      courierData?.success_ratio !== undefined
        ? Math.round(Number(courierData.success_ratio || 0))
        : totalOrders > 0
        ? Math.round((totalDelivered / totalOrders) * 100)
        : 0;

    const hasOrders = totalOrders > 0;
    return {
      totalOrders,
      totalDelivered,
      totalCanceled,
      overallSuccess,
      hasOrders,
    };
  }, [courierData, courierList]);

  const hasOrders = totals.hasOrders;
  const isSafe = hasOrders && totals.overallSuccess >= 60;

  const rowsWithTotal = useMemo(() => {
    if (!courierData) return courierList;

    return [
      ...courierList,
      {
        courier_name: "Total",
        total_parcels: totals.totalOrders,
        delivered_parcels: totals.totalDelivered,
        canceled_parcels: totals.totalCanceled,
        rowClass: "fc-row--total",
      },
    ];
  }, [courierData, courierList, totals]);

  const circleStroke = !hasOrders ? "#94a3b8" : isSafe ? "#23A11B" : "#ef4444";
  const circleTrail = !hasOrders ? "#e2e8f0" : isSafe ? "#eef2f7" : "#fdecec";

  return (
    <>
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">Fraud Information</h1>
        </div>
      </div>

      <div className="fc-shell">
        {!courierData && !loading ? (
          <div className="fc-empty-wrap">
            <div className="fc-empty-card">
              <div className="fc-empty-head">
                <div className="fc-empty-title">Fraud Checker</div>
                <div className="fc-empty-sub">
                  মোবাইল নাম্বার দিয়ে কুরিয়ার ডেলিভারি রিপোর্ট দেখুন
                </div>
              </div>

              <Form
                form={form}
                onFinish={handleCheck}
                className="fc-search-form fc-search-form--center"
              >
                <Form.Item
                  name="phone_number"
                  rules={[
                    { required: true, message: "Please enter phone number" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "Only numbers are allowed",
                    },
                  ]}
                >
                  <Input
                    placeholder="Mobile Number"
                    allowClear
                    className="fc-input"
                    size="large"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="fc-btn"
                >
                  রিপোর্ট দেখুন
                </Button>
              </Form>

              <div className="fc-empty-body">
                <Empty description="মোবাইল নাম্বার দিয়ে রিপোর্ট দেখুন" />
              </div>
            </div>
          </div>
        ) : null}

        {courierData ? (
          <div className="fc-board">
            <div className="fc-card fc-card--left">
              <div className="fc-left-title">Delivery Success Ratio</div>

              <div className="fc-circle-wrap">
                <Progress
                  type="circle"
                  percent={Math.min(100, Math.max(0, totals.overallSuccess))}
                  strokeColor={circleStroke}
                  trailColor={circleTrail}
                  size={268}
                  strokeWidth={12}
                  format={() => ""}
                />

                <div className="fc-circle-center">
                  <div className="fc-circle-percent">
                    {totals.overallSuccess}%
                  </div>
                </div>
              </div>

              {!hasOrders ? (
                <>
                  <div className="fc-risk-text is-neutral">তথ্য নেই</div>
                  <div className="fc-risk-sub">
                    এই নাম্বারে এখনো কোনো অর্ডার পাওয়া যায়নি।
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`fc-risk-text ${isSafe ? "is-safe" : "is-risk"}`}
                  >
                    {isSafe ? "ঝুঁকি মুক্ত" : "ঝুঁকিপূর্ণ"}
                  </div>

                  <div className="fc-risk-sub">
                    {isSafe
                      ? "এই কাস্টমারকে নিশ্চিন্তে পার্সেল দিতে পারেন।"
                      : "এই কাস্টমারের সাথে ডেলিভারিতে সতর্ক থাকুন।"}
                  </div>
                </>
              )}
            </div>

            <div className="fc-card fc-card--right">
              <div className="fc-topbar">
                <Form
                  form={form}
                  onFinish={handleCheck}
                  className="fc-search-form fc-search-form--right"
                >
                  <Form.Item
                    name="phone_number"
                    rules={[
                      { required: true, message: "Please enter phone number" },
                      {
                        pattern: /^[0-9]+$/,
                        message: "Only numbers are allowed",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Mobile Number"
                      allowClear
                      className="fc-input"
                      size="large"
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="fc-btn"
                  >
                    রিপোর্ট দেখুন
                  </Button>
                </Form>
              </div>

              <div className="fc-result-for">
                Result For: <span>{searchedPhone}</span>
              </div>

              <div className="fc-stats">
                <div className="fc-stat">
                  <div className="fc-stat-num fc-stat-num--dark">
                    {totals.totalOrders}
                  </div>
                  <div className="fc-stat-label">মোট অর্ডার</div>
                </div>

                <div className="fc-stat">
                  <div className="fc-stat-num fc-stat-num--green">
                    {totals.totalDelivered}
                  </div>
                  <div className="fc-stat-label">মোট ডেলিভারি</div>
                </div>

                <div className="fc-stat">
                  <div className="fc-stat-num fc-stat-num--red">
                    {totals.totalCanceled}
                  </div>
                  <div className="fc-stat-label">মোট বাতিল</div>
                </div>
              </div>

              <div className="fc-table-card">
                <div className="fc-ct-head">
                  <div className="fc-ct-h courier">কুরিয়ার</div>
                  <div className="fc-ct-h center">অর্ডার</div>
                  <div className="fc-ct-h center">ডেলিভারি</div>
                  <div className="fc-ct-h center">বাতিল</div>
                  <div className="fc-ct-h center">ডেলিভারি হার</div>
                </div>

                <div className="fc-ct-body">
                  {rowsWithTotal.map((r) => {
                    const isTotal = r.courier_name === "Total";
                    return (
                      <div
                        key={`${r.courier_name}-${isTotal ? "t" : "n"}`}
                        className={`fc-ct-row ${r.rowClass || ""}`}
                      >
                        <div className="fc-ct-courier">
                          {isTotal ? (
                            <div className="fc-total-text">Total</div>
                          ) : (
                            <div
                              className="fc-logo-pill"
                              title={r.courier_name}
                            >
                              <img
                                src={r.logo}
                                alt={r.courier_name}
                                className="fc-logo"
                              />
                            </div>
                          )}
                        </div>

                        <div className="fc-ct-num">
                          {Number(r.total_parcels || 0)}
                        </div>
                        <div className="fc-ct-num fc-ct-num--green">
                          {Number(r.delivered_parcels || 0)}
                        </div>
                        <div className="fc-ct-num fc-ct-num--red">
                          {Number(r.canceled_parcels || 0)}
                        </div>
                        <div className="fc-ct-num fc-ct-num--success">
                          {(() => {
                            const total = Number(r.total_parcels || 0);
                            const delivered = Number(r.delivered_parcels || 0);
                            const pct =
                              total > 0
                                ? Math.round((delivered / total) * 100)
                                : 0;
                            return `${pct}%`;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
