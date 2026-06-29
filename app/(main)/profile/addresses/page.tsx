"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2, Edit2, Check, Home, Briefcase, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { SearchableSelect } from "@/components/searchable-select"
import {
  fetchCustomerAddressesApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  deleteCustomerAddressApi,
  setDefaultCustomerAddressApi,
  fetchDivisions,
  fetchDistricts,
  fetchUpazilas,
  fetchUnions,
  type CustomerAddress,
  type Division,
  type District,
  type Upazila,
  type Union,
} from "@/lib/customer-addresses"
import { toLocationSelectOptions } from "@/lib/location-select"
import { useTranslation } from "@/lib/i18n"

type Address = CustomerAddress

export default function AddressesPage() {
  const { t } = useTranslation()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [divisions, setDivisions] = useState<Division[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [upazilas, setUpazilas] = useState<Upazila[]>([])
  const [unions, setUnions] = useState<Union[]>([])

  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [selectedDivisionId, setSelectedDivisionId] = useState("")
  const [selectedDistrictId, setSelectedDistrictId] = useState("")
  const [selectedUpazilaId, setSelectedUpazilaId] = useState("")
  const [selectedUnionId, setSelectedUnionId] = useState("")
  const [zip, setZip] = useState("")
  const [country, setCountry] = useState("Bangladesh")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    loadAddresses()
    loadInitialLocations()
  }, [])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const data = await fetchCustomerAddressesApi()
      setAddresses(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load saved addresses.")
    } finally {
      setLoading(false)
    }
  }

  const loadInitialLocations = async () => {
    try {
      const data = await fetchDivisions()
      setDivisions(data)
    } catch (err) {
      console.error("Failed to load divisions:", err)
    }
  }

  const handleDivisionChange = async (divId: string) => {
    setSelectedDivisionId(divId)
    setSelectedDistrictId("")
    setSelectedUpazilaId("")
    setSelectedUnionId("")
    setDistricts([])
    setUpazilas([])
    setUnions([])
    if (divId) {
      try {
        const data = await fetchDistricts(Number(divId))
        setDistricts(data)
      } catch { toast.error("Failed to load districts.") }
    }
  }

  const handleDistrictChange = async (distId: string) => {
    setSelectedDistrictId(distId)
    setSelectedUpazilaId("")
    setSelectedUnionId("")
    setUpazilas([])
    setUnions([])
    if (distId) {
      try {
        const data = await fetchUpazilas(Number(distId))
        setUpazilas(data)
      } catch { toast.error("Failed to load upazilas.") }
    }
  }

  const handleUpazilaChange = async (upaId: string) => {
    setSelectedUpazilaId(upaId)
    setSelectedUnionId("")
    setUnions([])
    if (upaId) {
      try {
        const data = await fetchUnions(Number(upaId))
        setUnions(data)
      } catch { toast.error("Failed to load unions.") }
    }
  }

  const openAddModal = () => {
    setEditingAddress(null)
    setTitle("Home")
    setName("")
    setPhone("")
    setEmail("")
    setAddressLine("")
    setSelectedDivisionId("")
    setSelectedDistrictId("")
    setSelectedUpazilaId("")
    setSelectedUnionId("")
    setDistricts([])
    setUpazilas([])
    setUnions([])
    setZip("")
    setCountry("Bangladesh")
    setIsDefault(false)
    setIsOpen(true)
  }

  const openEditModal = async (addr: Address) => {
    setEditingAddress(addr)
    setTitle(addr.title)
    setName(addr.name)
    setPhone(addr.phone)
    setEmail(addr.email)
    setAddressLine(addr.address)
    setZip(addr.zip)
    setCountry(addr.country)
    setIsDefault(addr.isDefault)

    const divId = addr.division_id ? String(addr.division_id) : ""
    const distId = addr.district_id ? String(addr.district_id) : ""
    const upaId = addr.upazila_id ? String(addr.upazila_id) : ""
    const uniId = addr.union_id ? String(addr.union_id) : ""

    setSelectedDivisionId(divId)
    setSelectedDistrictId(distId)
    setSelectedUpazilaId(upaId)
    setSelectedUnionId(uniId)
    setIsOpen(true)

    try {
      if (divId) { const d = await fetchDistricts(Number(divId)); setDistricts(d) } else setDistricts([])
      if (distId) { const u = await fetchUpazilas(Number(distId)); setUpazilas(u) } else setUpazilas([])
      if (upaId) { const u2 = await fetchUnions(Number(upaId)); setUnions(u2) } else setUnions([])
    } catch (err) { console.error("Failed to load chained location inputs during edit:", err) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const addressData = {
      title: title || "Address",
      name, phone, email: email || "",
      address: addressLine, zip, country,
      division_id: selectedDivisionId ? Number(selectedDivisionId) : null,
      district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
      upazila_id: selectedUpazilaId ? Number(selectedUpazilaId) : null,
      union_id: selectedUnionId ? Number(selectedUnionId) : null,
      is_default: isDefault,
    }
    try {
      setSaving(true)
      if (editingAddress) {
        await updateCustomerAddressApi(editingAddress.id, addressData)
        toast.success("Address updated successfully!")
      } else {
        await createCustomerAddressApi(addressData)
        toast.success("Address added successfully!")
      }
      setIsOpen(false)
      loadAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to save address. Please check your inputs.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string | number) => {
    const toDelete = addresses.find((a) => a.id === id)
    if (toDelete?.isDefault && addresses.length > 1) {
      toast.error("Cannot delete default address", {
        description: "Please set another address as default before deleting this one.",
      })
      return
    }
    try {
      await deleteCustomerAddressApi(id)
      toast.success("Address deleted successfully!")
      loadAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address.")
    }
  }

  const handleSetDefault = async (id: string | number) => {
    try {
      await setDefaultCustomerAddressApi(id)
      toast.success("Default address updated successfully!")
      loadAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to update default address.")
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t("saved_addresses_title")}</h2>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-1.5 size-sm sm:size-default">
          <Plus className="h-4 w-4" /> {t("add_address_btn")}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading_addresses")}</div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="font-semibold">{t("no_addresses_saved")}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t("add_shipping_address_hint")}</p>
          <Button onClick={openAddModal}>{t("add_new_address_btn")}</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-xl p-5 flex flex-col justify-between transition-all relative ${
                addr.isDefault ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {addr.title.toLowerCase().includes("home") ? (
                      <Home className="h-4 w-4 text-muted-foreground" />
                    ) : addr.title.toLowerCase().includes("office") || addr.title.toLowerCase().includes("work") ? (
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">{addr.title}</span>
                  </div>
                  {addr.isDefault && (
                    <Badge variant="default" className="text-2xs font-semibold px-2 py-0.5">
                      {t("default_badge")}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{addr.name}</p>
                  <p className="text-muted-foreground">{addr.address}</p>
                  {addr.division_relation ? (
                    <p className="text-muted-foreground">
                      {[addr.union_relation?.name, addr.upazila_relation?.name, addr.district_relation?.name, addr.division_relation?.name].filter(Boolean).join(", ")}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">{addr.city}-{addr.zip}, {addr.division}</p>
                  )}
                  <p className="text-muted-foreground">{addr.zip && `${addr.zip}, `}{addr.country}</p>
                  <p className="text-muted-foreground text-xs mt-2">{t("phone_label")} {addr.phone}</p>
                  {addr.email && <p className="text-muted-foreground text-xs">{t("email_label")} {addr.email}</p>}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                {!addr.isDefault ? (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-semibold text-primary hover:underline">
                    {t("set_as_default_btn")}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" /> {t("default_address_label")}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(addr)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? t("edit_address_title") : t("add_address_title")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="addrTitle">{t("address_title_label")}</Label>
                <Input id="addrTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Home" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">{t("full_name")}</Label>
                <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("recipient_name_placeholder")} required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="phoneNo">{t("phone_number")}</Label>
                <Input id="phoneNo" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emailId">{t("email_optional_label")}</Label>
                <Input id="emailId" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="streetAddr">{t("street_address_label")}</Label>
              <Input id="streetAddr" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="House #, Road #, Village" required />
            </div>

            {country === "Bangladesh" ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="division">{t("division")}</Label>
                    <SearchableSelect id="division" value={selectedDivisionId} onValueChange={handleDivisionChange} options={toLocationSelectOptions(divisions)} placeholder={t("select_division")} searchPlaceholder={t("search_division")} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="district">{t("district")}</Label>
                    <SearchableSelect id="district" value={selectedDistrictId} onValueChange={handleDistrictChange} options={toLocationSelectOptions(districts)} placeholder={t("select_district")} searchPlaceholder={t("search_district")} disabled={!selectedDivisionId} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="upazila">{t("upazila")}</Label>
                    <SearchableSelect id="upazila" value={selectedUpazilaId} onValueChange={handleUpazilaChange} options={toLocationSelectOptions(upazilas)} placeholder={t("select_upazila")} searchPlaceholder={t("search_upazila")} disabled={!selectedDistrictId} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="union">{t("union")}</Label>
                    <SearchableSelect id="union" value={selectedUnionId} onValueChange={setSelectedUnionId} options={toLocationSelectOptions(unions)} placeholder={t("select_union")} searchPlaceholder={t("search_union")} disabled={!selectedUpazilaId} required />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="addrCity">{t("city")}</Label>
                  <Input id="addrCity" value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} placeholder={t("city")} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addrDiv">{t("state_region")}</Label>
                  <Input id="addrDiv" value={selectedDivisionId} onChange={(e) => setSelectedDivisionId(e.target.value)} placeholder={t("state_region")} required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="addrZip">{t("postal_code")}</Label>
                <Input id="addrZip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="1209" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addrCountry">{t("country")}</Label>
                <select
                  id="addrCountry"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    if (e.target.value !== "Bangladesh") {
                      setSelectedDivisionId("")
                      setSelectedDistrictId("")
                      setSelectedUpazilaId("")
                      setSelectedUnionId("")
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="India">India</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="defaultAddr"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="defaultAddr" className="cursor-pointer font-medium text-sm">
                {t("set_default_billing_shipping")}
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("saving_ellipsis") : editingAddress ? t("save_changes") : t("save_address")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
