import TopHeader from "@/components/TopHeader";

const SETTINGS_SECTIONS = [
  {
    title: "Thông tin cửa hàng",
    icon: "🏪",
    fields: [
      { label: "Tên cửa hàng", value: "Tạp Hóa Phúc Lộc", type: "text" },
      { label: "Địa chỉ", value: "123 Đường Lê Văn Việt, Q9, TP.HCM", type: "text" },
      { label: "Số điện thoại", value: "0901 234 567", type: "tel" },
      { label: "Email", value: "taphoaphocloc@gmail.com", type: "email" },
      { label: "Mã số thuế", value: "", type: "text", placeholder: "Nhập MST nếu có..." },
    ],
  },
  {
    title: "Hóa đơn & Thanh toán",
    icon: "🧾",
    fields: [
      { label: "Tên hiển thị trên hóa đơn", value: "TẠP HÓA PHÚC LỘC", type: "text" },
      { label: "Lời cảm ơn cuối hóa đơn", value: "Cảm ơn quý khách! Hẹn gặp lại.", type: "text" },
      { label: "Thuế VAT (%)", value: "0", type: "number" },
      { label: "Đơn vị tiền tệ", value: "VND", type: "text" },
    ],
  },
  {
    title: "Tồn kho & Cảnh báo",
    icon: "📦",
    fields: [
      { label: "Ngưỡng cảnh báo tồn kho thấp (%) so với mức tối thiểu", value: "150", type: "number" },
      { label: "Email nhận cảnh báo tồn kho", value: "taphoaphocloc@gmail.com", type: "email" },
      { label: "Số ngày cận hạn sử dụng cần cảnh báo", value: "30", type: "number" },
    ],
  },
];

const TOGGLE_SETTINGS = [
  { label: "Tự động đề xuất đặt hàng lại", desc: "Hệ thống tự động gợi ý khi tồn kho thấp hơn mức tối thiểu", enabled: true },
  { label: "In hóa đơn sau mỗi giao dịch", desc: "Tự động mở hộp thoại in sau khi thanh toán thành công", enabled: false },
  { label: "Cho phép bán chịu (công nợ)", desc: "Thu ngân có thể ghi nợ cho khách khi chưa thanh toán đủ", enabled: true },
  { label: "Tích điểm khách hàng tự động", desc: "Cộng điểm cho khách thành viên sau mỗi giao dịch", enabled: true },
  { label: "Sao lưu dữ liệu hàng ngày", desc: "Tự động sao lưu lên cloud mỗi đêm lúc 02:00", enabled: true },
  { label: "Thông báo qua Zalo khi hàng sắp hết", desc: "Gửi Zalo OA tới chủ cửa hàng khi có hàng sắp hết", enabled: false },
];

export default function SettingsPage() {
  return (
    <>
      <TopHeader
        title="Cài đặt"
        subtitle="Cấu hình hệ thống cửa hàng"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm">↩️ Khôi phục mặc định</button>
            <button className="btn btn-primary btn-sm">💾 Lưu thay đổi</button>
          </div>
        }
      />

      <main className="page-content animate-fade-in">
        <div className="grid-2" style={{ alignItems: "start" }}>
          {/* Left column: form sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {SETTINGS_SECTIONS.map((section) => (
              <div key={section.title} className="card">
                <div className="card-header">
                  <div className="card-title">
                    {section.icon} {section.title}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {section.fields.map((field) => (
                    <div key={field.label} className="field-group">
                      <label className="field-label">{field.label}</label>
                      <input
                        type={field.type}
                        className="field-input"
                        defaultValue={field.value}
                        placeholder={"placeholder" in field ? field.placeholder : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right column: toggles + danger zone */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Toggle Settings */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">⚙️ Tùy chọn hoạt động</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {TOGGLE_SETTINGS.map((setting, i) => (
                  <div
                    key={setting.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.875rem 0",
                      borderBottom: i < TOGGLE_SETTINGS.length - 1 ? "1px solid var(--border-light)" : "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                        {setting.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {setting.desc}
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0, cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked={setting.enabled} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: "absolute", inset: 0,
                        background: setting.enabled ? "var(--primary)" : "var(--outline-variant)",
                        borderRadius: "var(--radius-full)",
                        transition: "background 0.2s",
                      }}>
                        <span style={{
                          position: "absolute",
                          width: 18, height: 18,
                          background: "white",
                          borderRadius: "50%",
                          top: 3,
                          left: setting.enabled ? 23 : 3,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Account & Security */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔐 Tài khoản & Bảo mật</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="field-group">
                  <label className="field-label">Mật khẩu hiện tại</label>
                  <input type="password" className="field-input" placeholder="••••••••" />
                </div>
                <div className="field-group">
                  <label className="field-label">Mật khẩu mới</label>
                  <input type="password" className="field-input" placeholder="••••••••" />
                </div>
                <div className="field-group">
                  <label className="field-label">Xác nhận mật khẩu mới</label>
                  <input type="password" className="field-input" placeholder="••••••••" />
                </div>
                <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
                  🔑 Đổi mật khẩu
                </button>
              </div>
            </div>

            {/* Backup */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">💾 Sao lưu & Khôi phục</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ background: "var(--surface-3)", borderRadius: "var(--radius)", padding: "0.75rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>Lần sao lưu gần nhất</div>
                  <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.875rem" }}>Hôm nay, 02:00 AM ✅</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" style={{ flex: 1 }}>📤 Xuất toàn bộ dữ liệu</button>
                  <button className="btn btn-outline" style={{ flex: 1 }}>📥 Nhập dữ liệu</button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-title" style={{ color: "var(--danger)", marginBottom: "0.75rem" }}>
                ⚠️ Vùng nguy hiểm
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Các thao tác này không thể hoàn tác. Hãy sao lưu dữ liệu trước khi thực hiện.
                </div>
                <button className="btn btn-danger">🗑️ Xóa toàn bộ lịch sử bán hàng</button>
                <button className="btn btn-danger">🔄 Đặt lại hệ thống về mặc định</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
