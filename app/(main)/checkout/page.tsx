"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CheckCircle, ChevronRight, CreditCard, MapPin, Truck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Spinner } from "../../../components/ui/spinner"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Separator } from "../../../components/ui/separator"
import { useCurrency } from "../../../lib/currency"
import { SearchableSelect } from "../../../components/searchable-select"
import {
  addressToLocationFields,
  emptyShippingForm,
  fetchCustomerAddressesApi,
  getDefaultCustomerAddress,
  fetchDivisions,
  fetchDistricts,
  fetchUpazilas,
  fetchUnions,
  type CustomerAddress,
  type ShippingFormFields,
  type Division,
  type District,
  type Upazila,
  type Union,
} from "../../../lib/customer-addresses"
import { toLocationSelectOptions } from "../../../lib/location-select"
import { getApiBaseUrl } from "../../../lib/api-base-url"
import {
  clearCustomerAuth,
  getCustomerAuth,
  getCustomerPersonalInfo,
  isCustomerLoggedIn,
  setCustomerPhone,
  type CustomerUser,
} from "../../../lib/customer-auth"
import { useStore, type CartItem } from "../../../lib/store-context"
import { useProductDefaultImage } from "../../../lib/product-image-context"
import { getProductImageSrc } from "../../../lib/product-image"
import {
  DHAKA_SHIPPING_CHARGE,
  getDistrictShippingCharge,
  OUTSIDE_DHAKA_SHIPPING_CHARGE,
} from "../../../lib/shipping"
import {
  createCustomerOrder,
  fetchCheckoutOptions,
  fetchCheckoutQuote,
  initiateSslcommerzCheckout,
  type CheckoutOptions,
  type CheckoutPaymentMethod,
  type CheckoutQuote,
  type CheckoutQuoteItem,
  type CheckoutQuoteRequestItem,
} from "../../../lib/customer-checkout"
import { useTranslation } from "../../../lib/i18n"

type CheckoutStep = "shipping" | "payment" | "confirmation"

type ShippingInfo = {
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  address: string
  area: string
  city: string
  state: string
  zip: string
  country: string
  note: string
}

const API_BASE_URL = getApiBaseUrl()

const fallbackPaymentMethods: CheckoutPaymentMethod[] = [
  // { value: "bkash", label: "bKash", description: "Pay with your bKash mobile wallet" },
  // { value: "nagad", label: "Nagad", description: "Pay with your Nagad mobile wallet" },
  {
    value: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, American Express",
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay when you receive your order",
  },
]

export default function CheckoutPage() {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const pathname = usePathname()
  const { cart, cartTotal, clearCart } = useStore()
  const productDefaultImage = useProductDefaultImage()

  const [step, setStep] = useState<CheckoutStep>("shipping")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [checkoutOptions, setCheckoutOptions] = useState<CheckoutOptions | null>(null)
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isLoadingQuote, setIsLoadingQuote] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [confirmationOrderNumber, setConfirmationOrderNumber] = useState<string | null>(null)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [shippingForm, setShippingForm] = useState<ShippingFormFields>(emptyShippingForm)

  // Locations state
  const [divisions, setDivisions] = useState<Division[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [upazilas, setUpazilas] = useState<Upazila[]>([])
  const [unions, setUnions] = useState<Union[]>([])

  const paymentMethods = checkoutOptions?.payment_methods?.length
    ? checkoutOptions.payment_methods
    : fallbackPaymentMethods

  const subtotal = quote?.subtotal ?? cartTotal
  const shippingDistrict = step === "payment" && shippingInfo ? shippingInfo.state : shippingForm.state
  const shippingCity = step === "payment" && shippingInfo ? shippingInfo.city : shippingForm.city
  const shippingCharge = getDistrictShippingCharge(shippingDistrict, shippingCity)
  const totalAmount = subtotal + shippingCharge
  const displayItems: Array<CheckoutQuoteItem | CartItem> = quote?.items ?? cart

  const resolveCheckoutProductId = (item: CartItem) => {
    if (typeof item.productId === "number" && Number.isFinite(item.productId)) {
      return item.productId
    }

    const parsedId = Number(item.id)
    return Number.isFinite(parsedId) ? parsedId : null
  }

  // Load Divisions
  useEffect(() => {
    fetchDivisions()
      .then((data) => setDivisions(data))
      .catch((err) => console.error("Failed to load divisions:", err))
  }, [])

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      clearCustomerAuth()
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    let isActive = true

    const initializeCheckout = async () => {
      const auth = getCustomerAuth()
      let user: CustomerUser | null = auth?.user ?? null

      if (auth?.token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `${auth.tokenType} ${auth.token}`,
            },
          })

          if (response.ok) {
            const data = await response.json().catch(() => null)
            if (data?.user) {
              user = data.user as CustomerUser
              localStorage.setItem("customer_user", JSON.stringify(data.user))
              if (data.user.phone) {
                setCustomerPhone(data.user.phone)
              }
            }
          }
        } catch {
          // Fall back to cached profile data.
        }
      }

      if (!isActive) {
        return
      }

      let addresses: CustomerAddress[] = []
      try {
        addresses = await fetchCustomerAddressesApi()
      } catch (err) {
        console.error("Failed to fetch customer addresses for checkout:", err)
      }

      const defaultAddress = getDefaultCustomerAddress(addresses)
      const personalInfo = getCustomerPersonalInfo(user)
      let initialForm: ShippingFormFields = {
        ...emptyShippingForm(),
        ...personalInfo,
        ...(defaultAddress ? addressToLocationFields(defaultAddress) : {}),
      }

      if (defaultAddress) {
        const trimmed = (defaultAddress.name || "").trim()
        const parts = trimmed.split(/\s+/)
        const firstName = parts[0] ?? ""
        const lastName = parts.slice(1).join(" ")

        initialForm = {
          ...initialForm,
          firstName: firstName || initialForm.firstName,
          lastName: lastName || initialForm.lastName,
          email: defaultAddress.email || initialForm.email,
          phone: defaultAddress.phone || initialForm.phone,
        }

        // Fetch location dropdown choices for the default address
        const divId = defaultAddress.division_id
        const distId = defaultAddress.district_id
        const upaId = defaultAddress.upazila_id

        try {
          if (divId) {
            const fetched = await fetchDistricts(Number(divId))
            setDistricts(fetched)
          }
          if (distId) {
            const fetched = await fetchUpazilas(Number(distId))
            setUpazilas(fetched)
          }
          if (upaId) {
            const fetched = await fetchUnions(Number(upaId))
            setUnions(fetched)
          }
        } catch (err) {
          console.error("Failed to load options for default address:", err)
        }
      }

      setSavedAddresses(addresses)
      setSelectedAddressId(defaultAddress ? String(defaultAddress.id) : null)
      setShippingForm(initialForm)
      setIsReady(true)
    }

    initializeCheckout()

    return () => {
      isActive = false
    }
  }, [pathname, router])

  useEffect(() => {
    if (!isReady) {
      return
    }

    let isActive = true

    setIsLoadingOptions(true)
    fetchCheckoutOptions()
      .then((data: CheckoutOptions) => {
        if (isActive) {
          setCheckoutOptions(data)
          setError("")
        }
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setError(caught instanceof Error ? caught.message : "Unable to load checkout options.")
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingOptions(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isReady])

  useEffect(() => {
    if (!isReady || cart.length === 0) {
      setQuote(null)
      setIsLoadingQuote(false)
      return
    }

    const quoteItems: CheckoutQuoteRequestItem[] = []
    for (const item of cart) {
      const productId = resolveCheckoutProductId(item)
      if (productId !== null) {
        quoteItems.push({ product_id: productId, quantity: item.quantity })
      }
    }

    if (quoteItems.length === 0) {
      setQuote(null)
      setIsLoadingQuote(false)
      setError("Unable to resolve product ids for checkout.")
      return
    }

    let isActive = true

    setIsLoadingQuote(true)
    fetchCheckoutQuote(quoteItems)
      .then((data: CheckoutQuote) => {
        if (isActive) {
          setQuote(data)
          setError("")
        }
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setQuote(null)
          setError(caught instanceof Error ? caught.message : "Unable to calculate checkout quote.")
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingQuote(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [cart, isReady])

  useEffect(() => {
    if (!paymentMethods.some((method: CheckoutPaymentMethod) => method.value === paymentMethod) && paymentMethods.length > 0) {
      setPaymentMethod(paymentMethods[0].value)
    }
  }, [paymentMethod, paymentMethods])

  useEffect(() => {
    if (cart.length === 0 && step !== "confirmation") {
      router.replace("/cart")
    }
  }, [cart.length, router, step])

  const updateShippingField = (field: keyof ShippingFormFields, value: string) => {
    setShippingForm((current) => ({ ...current, [field]: value }))
  }

  // Chained Location select changes
  const handleDivisionChange = async (divId: string) => {
    const divObj = divisions.find((d) => String(d.id) === divId)
    const divName = divObj ? divObj.name : ""

    setShippingForm((current) => ({
      ...current,
      divisionId: divId,
      districtId: "",
      upazilaId: "",
      unionId: "",
      state: "",
      city: "",
      area: "",
    }))
    setDistricts([])
    setUpazilas([])
    setUnions([])

    if (divId) {
      try {
        const fetched = await fetchDistricts(Number(divId))
        setDistricts(fetched)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDistrictChange = async (distId: string) => {
    const distObj = districts.find((d) => String(d.id) === distId)
    const distName = distObj ? distObj.name : ""

    setShippingForm((current) => ({
      ...current,
      districtId: distId,
      upazilaId: "",
      unionId: "",
      state: distName, // triggers shipping charge change
      city: "",
      area: "",
    }))
    setUpazilas([])
    setUnions([])

    if (distId) {
      try {
        const fetched = await fetchUpazilas(Number(distId))
        setUpazilas(fetched)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleUpazilaChange = async (upaId: string) => {
    const upaObj = upazilas.find((u) => String(u.id) === upaId)
    const upaName = upaObj ? upaObj.name : ""

    setShippingForm((current) => ({
      ...current,
      upazilaId: upaId,
      unionId: "",
      city: upaName,
      area: upaName,
    }))
    setUnions([])

    if (upaId) {
      try {
        const fetched = await fetchUnions(Number(upaId))
        setUnions(fetched)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleUnionChange = (uniId: string) => {
    const uniObj = unions.find((u) => String(u.id) === uniId)
    const uniName = uniObj ? uniObj.name : ""
    const upaObj = upazilas.find((u) => String(u.id) === shippingForm.upazilaId)
    const upaName = upaObj ? upaObj.name : ""

    const areaText = [uniName, upaName].filter(Boolean).join(", ")

    setShippingForm((current) => ({
      ...current,
      unionId: uniId,
      area: areaText,
    }))
  }

  const applySavedAddress = async (address: CustomerAddress) => {
    setSelectedAddressId(String(address.id))
    const trimmed = (address.name || "").trim()
    const parts = trimmed.split(/\s+/)
    const firstName = parts[0] ?? ""
    const lastName = parts.slice(1).join(" ")

    const divId = address.division_id ? String(address.division_id) : ""
    const distId = address.district_id ? String(address.district_id) : ""
    const upaId = address.upazila_id ? String(address.upazila_id) : ""
    const uniId = address.union_id ? String(address.union_id) : ""

    try {
      if (address.division_id) {
        const data = await fetchDistricts(address.division_id)
        setDistricts(data)
      } else {
        setDistricts([])
      }
      if (address.district_id) {
        const data = await fetchUpazilas(address.district_id)
        setUpazilas(data)
      } else {
        setUpazilas([])
      }
      if (address.upazila_id) {
        const data = await fetchUnions(address.upazila_id)
        setUnions(data)
      } else {
        setUnions([])
      }
    } catch (err) {
      console.error(err)
    }

    setShippingForm((current) => ({
      ...current,
      ...addressToLocationFields(address),
      firstName,
      lastName,
      email: address.email || "",
      phone: address.phone || "",
      divisionId: divId,
      districtId: distId,
      upazilaId: upaId,
      unionId: uniId,
    }))
  }

  const handleSubmitShipping = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const firstName = shippingForm.firstName.trim()
    const lastName = shippingForm.lastName.trim()
    const name = [firstName, lastName].filter(Boolean).join(" ")

    setShippingInfo({
      firstName,
      lastName,
      name,
      email: shippingForm.email.trim(),
      phone: shippingForm.phone.trim(),
      address: shippingForm.address.trim(),
      area: shippingForm.area.trim(),
      city: shippingForm.city.trim(),
      state: shippingForm.state.trim(),
      zip: shippingForm.zip.trim(),
      country: shippingForm.country.trim(),
      note: shippingForm.note.trim(),
    })

    setStep("payment")
  }

  const handleSubmitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const firstName = String(formData.get("firstName") ?? "").trim()
    const lastName = String(formData.get("lastName") ?? "").trim()
    const name = [firstName, lastName].filter(Boolean).join(" ")

    const items: CheckoutQuoteRequestItem[] = []
    for (const item of cart) {
      const productId = resolveCheckoutProductId(item)
      if (productId !== null) {
        items.push({ product_id: productId, quantity: item.quantity })
      }
    }

    if (items.length === 0) {
      setError("Unable to resolve product ids for order submission.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      if (!shippingInfo) {
        setError("Please complete shipping information first.")
        setStep("shipping")
        return
      }

      // Convert division_id to a name string for division parameter if it exists
      const selectedDivObj = divisions.find((d) => String(d.id) === shippingForm.divisionId)
      const divisionName = selectedDivObj ? selectedDivObj.name : shippingInfo.state

      const requestPayload = {
        items,
        payment_method: paymentMethod,
        first_name: shippingInfo.firstName || undefined,
        last_name: shippingInfo.lastName || undefined,
        name: shippingInfo.name || undefined,
        email: shippingInfo.email || undefined,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        apartment: shippingInfo.area || undefined,
        division: divisionName || undefined,
        city: shippingInfo.city,
        zip: shippingInfo.zip || undefined,
        postal_code: shippingInfo.zip || undefined,
        country: shippingInfo.country || undefined,
        transaction_id: null,
        note: shippingInfo.note || undefined,
      }

      if (paymentMethod === "card") {
        const response = await initiateSslcommerzCheckout(requestPayload)
        window.location.href = response.gateway_url
        return
      }

      const response = await createCustomerOrder(requestPayload)

      setConfirmationOrderNumber(response.data.order_number)
      clearCart()
      setStep("confirmation")
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to place order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isReady) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Spinner className="mx-auto mb-4 h-8 w-8" />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (step === "confirmation") {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("order_confirmed")}</h1>
          <p className="text-muted-foreground mb-4">
            {t("order_sent_to_system")}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {t("order_number")} {confirmationOrderNumber ?? "Pending"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/profile/orders">{t("view_orders")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/shop">{t("continue_shopping")}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/cart" className="hover:text-foreground transition-colors">
          {t("shopping_cart")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className={step === "shipping" ? "text-foreground" : ""}>{t("shipping")}</span>
        <ChevronRight className="h-4 w-4" />
        <span className={step === "payment" ? "text-foreground" : ""}>{t("payment")}</span>
      </nav>

      {error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>{t("checkout_error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          {step === "shipping" && (
            <form onSubmit={handleSubmitShipping}>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t("shipping_info")}
              </h2>

              {savedAddresses.length > 0 ? (
                <div className="mb-8 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {t("saved_addresses")}
                    </p>
                    <Link href="/profile/addresses" className="text-xs font-medium text-primary hover:underline">
                      {t("manage_addresses")}
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((address) => {
                      const isSelected = selectedAddressId === String(address.id)

                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-input hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold">{address.title}</span>
                            {address.isDefault ? (
                              <span className="text-2xs font-medium text-primary">{t("default_address")}</span>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium">{address.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{address.address}</p>
                          
                          {address.division_relation ? (
                            <p className="text-xs text-muted-foreground">
                              {[
                                address.union_relation?.name,
                                address.upazila_relation?.name,
                                address.district_relation?.name,
                                address.division_relation?.name
                              ].filter(Boolean).join(", ")}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {address.city}-{address.zip}, {address.division}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground">{address.country}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-semibold">Phone: {address.phone}</p>
                          {address.email ? (
                            <p className="text-xs text-muted-foreground">Email: {address.email}</p>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("select_address_hint")}
                  </p>
                </div>
              ) : (
                <p className="mb-6 text-sm text-muted-foreground">
                  {t("no_saved_address")}{" "}
                  <Link href="/profile/addresses" className="font-medium text-primary hover:underline">
                    {t("add_address_profile")}
                  </Link>{" "}
                  {t("faster_checkout")}
                </p>
              )}

              <div className="grid gap-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("first_name")}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      required
                      value={shippingForm.firstName}
                      onChange={(event) => updateShippingField("firstName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("last_name")}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                      value={shippingForm.lastName}
                      onChange={(event) => updateShippingField("lastName", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email_address")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={shippingForm.email}
                    onChange={(event) => updateShippingField("email", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={shippingForm.phone}
                    onChange={(event) => updateShippingField("phone", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("street_address")}</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Main Street"
                    required
                    value={shippingForm.address}
                    onChange={(event) => updateShippingField("address", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t("country")}</Label>
                  <select
                    id="country"
                    name="country"
                    value={shippingForm.country}
                    onChange={(e) => {
                      updateShippingField("country", e.target.value)
                      if (e.target.value !== "Bangladesh") {
                        setShippingForm((current) => ({
                          ...current,
                          divisionId: "",
                          districtId: "",
                          upazilaId: "",
                          unionId: "",
                        }))
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

                {/* Bangladesh dynamic location dropdowns */}
                {shippingForm.country === "Bangladesh" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="division">{t("division")}</Label>
                        <SearchableSelect
                          id="division"
                          value={shippingForm.divisionId || ""}
                          onValueChange={handleDivisionChange}
                          options={toLocationSelectOptions(divisions)}
                          placeholder={t("select_division")}
                          searchPlaceholder={t("search_division")}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">{t("district")}</Label>
                        <SearchableSelect
                          id="district"
                          value={shippingForm.districtId || ""}
                          onValueChange={handleDistrictChange}
                          options={toLocationSelectOptions(districts)}
                          placeholder={t("select_district")}
                          searchPlaceholder={t("search_district")}
                          disabled={!shippingForm.divisionId}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("shipping_dhaka_others").replace("{dhaka}", formatPrice(DHAKA_SHIPPING_CHARGE)).replace("{others}", formatPrice(OUTSIDE_DHAKA_SHIPPING_CHARGE))}
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="upazila">{t("upazila")}</Label>
                        <SearchableSelect
                          id="upazila"
                          value={shippingForm.upazilaId || ""}
                          onValueChange={handleUpazilaChange}
                          options={toLocationSelectOptions(upazilas)}
                          placeholder={t("select_upazila")}
                          searchPlaceholder={t("search_upazila")}
                          disabled={!shippingForm.districtId}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="union">{t("union")}</Label>
                        <SearchableSelect
                          id="union"
                          value={shippingForm.unionId || ""}
                          onValueChange={handleUnionChange}
                          options={toLocationSelectOptions(unions)}
                          placeholder={t("select_union")}
                          searchPlaceholder={t("search_union")}
                          disabled={!shippingForm.upazilaId}
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Dhaka"
                        required
                        value={shippingForm.city}
                        onChange={(event) => updateShippingField("city", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="Dhaka"
                        required
                        value={shippingForm.state}
                        onChange={(event) => updateShippingField("state", event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("shipping_dhaka_others").replace("{dhaka}", formatPrice(DHAKA_SHIPPING_CHARGE)).replace("{others}", formatPrice(OUTSIDE_DHAKA_SHIPPING_CHARGE))}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="zip">{t("postal_code")}</Label>
                  <Input
                    id="zip"
                    name="zip"
                    placeholder="1205"
                    required
                    value={shippingForm.zip}
                    onChange={(event) => updateShippingField("zip", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">{t("order_note")}</Label>
                  <Input
                    id="note"
                    name="note"
                    placeholder={t("delivery_instructions")}
                    value={shippingForm.note}
                    onChange={(event) => updateShippingField("note", event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button type="submit" size="lg">
                  {t("continue_to_payment")}
                </Button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <form onSubmit={handleSubmitPayment}>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("payment_method")}
              </h2>

              {isLoadingOptions ? (
                <p className="mb-4 text-sm text-muted-foreground">{t("loading_payment_methods")}</p>
              ) : null}

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                {paymentMethods.map((method: CheckoutPaymentMethod) => (
                  <div key={method.value} className="flex items-center space-x-3 border border-input rounded-lg p-4">
                    <RadioGroupItem value={method.value} id={method.value} />
                    <Label htmlFor={method.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{method.label}</span>
                      <span className="block text-sm text-muted-foreground">{method.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-8 flex gap-4 justify-between">
                <Button type="button" variant="outline" onClick={() => setStep("shipping")}>{t("back_to_shipping")}</Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t("placing_order") : t("place_order")}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-muted rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4 max-h-64 overflow-y-auto">
              {displayItems.map((item: CheckoutQuoteItem | CartItem) => {
                const itemName = "product_name" in item ? item.product_name : item.name
                const itemImage = getProductImageSrc(item.image, productDefaultImage)
                const itemTotal = "total_price" in item ? item.total_price : item.price * item.quantity

                return (
                  <div key={`${itemName}-${item.quantity}`} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-background shrink-0">
                      {itemImage ? (
                        <Image
                          src={itemImage}
                          alt={itemName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{itemName}</p>
                      {"selectedSize" in item || "selectedColor" in item ? (
                        <p className="text-xs text-muted-foreground">
                          {"selectedSize" in item && item.selectedSize ? `Size: ${item.selectedSize}` : ""}
                          {"selectedSize" in item && item.selectedSize && "selectedColor" in item && item.selectedColor ? " / " : ""}
                          {"selectedColor" in item && item.selectedColor ? `Color: ${item.selectedColor}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium">{formatPrice(itemTotal)}</span>
                  </div>
                )
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{(shippingCharge as number) === 0 ? "Free" : formatPrice(shippingCharge)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
