"use client";

import { useState } from "react";
import { AccountShell } from "@/components/AccountShell";
import { PhoneInput } from "@/components/PhoneInput";
import { ZipInput } from "@/components/ZipInput";
import { digitsOnly, formatUSPhoneDisplay, isCompleteUSPhone } from "@/lib/phone";
import { zipDigitsOnly, isValidUsZip5 } from "@/lib/input-security";

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isPrimary: boolean;
};

const EMPTY_FORM: Omit<Address, "id" | "isPrimary"> = {
  firstName: "", lastName: "", company: "",
  street: "", city: "", state: "", zip: "",
  country: "United States", phone: "",
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export function AddressBookClient() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "default",
      firstName: "Demo", lastName: "Customer",
      company: "Julius Silvert B2B",
      street: "25 Zane Street Apt A",
      city: "Glassboro", state: "NJ", zip: "08028",
      country: "United States", phone: "(215) 455-1600",
      isPrimary: true,
    },
  ]);

  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState<Partial<typeof EMPTY_FORM>>({});
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    setEditId(addr.id);
    setForm({ firstName: addr.firstName, lastName: addr.lastName, company: addr.company,
      street: addr.street, city: addr.city, state: addr.state, zip: zipDigitsOnly(addr.zip),
      country: addr.country, phone: digitsOnly(addr.phone) });
    setErrors({});
    setShowForm(true);
  }

  function validate() {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.street.trim())    e.street    = "Required";
    if (!form.city.trim())      e.city      = "Required";
    if (!form.state.trim())     e.state     = "Required";
    if (!isValidUsZip5(form.zip)) e.zip = "Enter a 5-digit ZIP code.";
    if (form.phone && !isCompleteUSPhone(form.phone)) {
      e.phone = "Enter 10 digits or leave blank.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function saveAddress() {
    if (!validate()) return;
    const phoneOut = form.phone ? formatUSPhoneDisplay(form.phone) : "";
    const payload = { ...form, phone: phoneOut };
    if (editId) {
      setAddresses((prev) => prev.map((a) => a.id === editId ? { ...a, ...payload } : a));
    } else {
      const newAddr: Address = { ...payload, id: Date.now().toString(), isPrimary: addresses.length === 0 };
      setAddresses((prev) => [...prev, newAddr]);
    }
    setShowForm(false);
  }

  function setPrimary(id: string) {
    setAddresses((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === id })));
  }

  function deleteAddress(id: string) {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      // If we deleted the primary, make the first remaining one primary
      if (filtered.length > 0 && !filtered.some((a) => a.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
    setDeleteId(null);
  }

  const f = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const primaryAddr   = addresses.find((a) => a.isPrimary);
  const otherAddrs    = addresses.filter((a) => !a.isPrimary);

  return (
    <AccountShell title="My Account">
      <div className="acct-ab-page">
        <div className="acct-ab-topbar">
          <h3 className="acct-section-heading">Address Book</h3>
          <button className="acct-add-addr-btn" onClick={openNew}>+ Add New Address</button>
        </div>

        {/* Default Shipping Address */}
        {primaryAddr && (
          <div className="acct-ab-section">
            <h4 className="acct-ab-section-title">Default Addresses</h4>
            <div className="acct-ab-cards">
              <div className="acct-addr-card primary">
                <div className="acct-addr-badge">Default Shipping Address</div>
                <p className="acct-addr-name">{primaryAddr.firstName} {primaryAddr.lastName}</p>
                {primaryAddr.company && <p className="acct-addr-line">{primaryAddr.company}</p>}
                <p className="acct-addr-line">{primaryAddr.street}</p>
                <p className="acct-addr-line">{primaryAddr.city}, {primaryAddr.state} {primaryAddr.zip}</p>
                <p className="acct-addr-line">{primaryAddr.country}</p>
                {primaryAddr.phone && <p className="acct-addr-line">T: {primaryAddr.phone}</p>}
                <div className="acct-addr-actions">
                  <button className="acct-addr-edit" onClick={() => openEdit(primaryAddr)}>Edit</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional addresses */}
        <div className="acct-ab-section">
          <h4 className="acct-ab-section-title">Address Book</h4>
          {otherAddrs.length === 0 ? (
            <p className="acct-ab-empty">You have no other address entries in your address book.</p>
          ) : (
            <div className="acct-ab-cards">
              {otherAddrs.map((addr) => (
                <div key={addr.id} className="acct-addr-card">
                  <p className="acct-addr-name">{addr.firstName} {addr.lastName}</p>
                  {addr.company && <p className="acct-addr-line">{addr.company}</p>}
                  <p className="acct-addr-line">{addr.street}</p>
                  <p className="acct-addr-line">{addr.city}, {addr.state} {addr.zip}</p>
                  <p className="acct-addr-line">{addr.country}</p>
                  {addr.phone && <p className="acct-addr-line">T: {addr.phone}</p>}
                  <div className="acct-addr-actions">
                    <button className="acct-addr-edit"    onClick={() => openEdit(addr)}>Edit</button>
                    <button className="acct-addr-primary" onClick={() => setPrimary(addr.id)}>Set as Primary</button>
                    <button className="acct-addr-delete"  onClick={() => setDeleteId(addr.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {otherAddrs.length === 0 && (
            <button className="acct-back-link" onClick={() => history.back()}>← Go Back</button>
          )}
        </div>

        {/* Add / Edit form modal */}
        {showForm && (
          <div className="acct-modal-backdrop" onClick={() => setShowForm(false)}>
            <div className="acct-modal" onClick={(e) => e.stopPropagation()}>
              <div className="acct-modal-header">
                <h4>{editId ? "Edit Address" : "Add New Address"}</h4>
                <button className="acct-modal-close" onClick={() => setShowForm(false)}>×</button>
              </div>
              <div className="acct-form">
                <div className="acct-form-row">
                  <div className="acct-form-field">
                    <label className="acct-form-label">First Name <span className="req">*</span></label>
                    <input className={`acct-form-input${errors.firstName ? " err" : ""}`}
                      value={form.firstName} onChange={f("firstName")} placeholder="First name" />
                    {errors.firstName && <span className="acct-form-err">{errors.firstName}</span>}
                  </div>
                  <div className="acct-form-field">
                    <label className="acct-form-label">Last Name <span className="req">*</span></label>
                    <input className={`acct-form-input${errors.lastName ? " err" : ""}`}
                      value={form.lastName} onChange={f("lastName")} placeholder="Last name" />
                    {errors.lastName && <span className="acct-form-err">{errors.lastName}</span>}
                  </div>
                </div>
                <div className="acct-form-field">
                  <label className="acct-form-label">Company / Business Name</label>
                  <input className="acct-form-input" value={form.company} onChange={f("company")} placeholder="Optional" />
                </div>
                <div className="acct-form-field">
                  <label className="acct-form-label">Street Address <span className="req">*</span></label>
                  <input className={`acct-form-input${errors.street ? " err" : ""}`}
                    value={form.street} onChange={f("street")} placeholder="123 Main Street" />
                  {errors.street && <span className="acct-form-err">{errors.street}</span>}
                </div>
                <div className="acct-form-row">
                  <div className="acct-form-field">
                    <label className="acct-form-label">City <span className="req">*</span></label>
                    <input className={`acct-form-input${errors.city ? " err" : ""}`}
                      value={form.city} onChange={f("city")} placeholder="City" />
                    {errors.city && <span className="acct-form-err">{errors.city}</span>}
                  </div>
                  <div className="acct-form-field">
                    <label className="acct-form-label">State <span className="req">*</span></label>
                    <select className={`acct-form-select${errors.state ? " err" : ""}`}
                      value={form.state} onChange={f("state")}>
                      <option value="">— Select —</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <span className="acct-form-err">{errors.state}</span>}
                  </div>
                  <div className="acct-form-field" style={{ maxWidth: 110 }}>
                    <label className="acct-form-label">ZIP <span className="req">*</span></label>
                    <ZipInput
                      className={`acct-form-input${errors.zip ? " err" : ""}`}
                      value={form.zip}
                      onChange={(z) => { setForm((p) => ({ ...p, zip: z })); setErrors((er) => ({ ...er, zip: "" })); }}
                      placeholder="08028"
                      aria-invalid={!!errors.zip}
                    />
                    {errors.zip && <span className="acct-form-err">{errors.zip}</span>}
                  </div>
                </div>
                <div className="acct-form-row">
                  <div className="acct-form-field">
                    <label className="acct-form-label">Country</label>
                    <select className="acct-form-select" value={form.country} onChange={f("country")}>
                      <option>United States</option>
                      <option>Canada</option>
                    </select>
                  </div>
                  <div className="acct-form-field">
                    <label className="acct-form-label">Phone Number</label>
                    <PhoneInput
                      className={`acct-form-input${errors.phone ? " err" : ""}`}
                      value={form.phone}
                      onChange={(d) => { setForm((p) => ({ ...p, phone: d })); setErrors((er) => ({ ...er, phone: "" })); }}
                    />
                    {errors.phone && <span className="acct-form-err">{errors.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="acct-modal-footer">
                <button className="acct-save-btn" onClick={saveAddress}>
                  {editId ? "Save Changes" : "Add Address"}
                </button>
                <button className="acct-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {deleteId && (
          <div className="acct-modal-backdrop" onClick={() => setDeleteId(null)}>
            <div className="acct-modal acct-modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="acct-modal-header">
                <h4>Remove Address</h4>
                <button className="acct-modal-close" onClick={() => setDeleteId(null)}>×</button>
              </div>
              <p style={{ padding: "1rem 1.5rem", color: "#444", fontSize: "0.9rem" }}>
                Are you sure you want to remove this address? This cannot be undone.
              </p>
              <div className="acct-modal-footer">
                <button className="acct-delete-btn" onClick={() => deleteAddress(deleteId!)}>Yes, Remove</button>
                <button className="acct-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AccountShell>
  );
}
