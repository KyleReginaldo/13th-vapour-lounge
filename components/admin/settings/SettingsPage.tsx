"use client";

import { updateShopSettings } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Store,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BusinessHoursManager } from "./BusinessHoursManager";
import { FeatureToggles } from "./FeatureToggles";
import { LegalDocumentsManager } from "./LegalDocumentsManager";

interface SettingsPageProps {
  initialSettings: Record<string, any>;
}

export function SettingsPage({ initialSettings }: SettingsPageProps) {
  const router = useRouter();

  const s = initialSettings ?? {};

  // General settings
  const [shopName, setShopName] = useState(s.shop_name ?? "13th Vapour Lounge");
  const [shopEmail, setShopEmail] = useState(
    s.shop_email ?? "info@vapourlounge.com"
  );
  const [shopPhone, setShopPhone] = useState(
    s.shop_phone ?? "+63 917 000 0000"
  );
  const [shopAddress, setShopAddress] = useState(
    s.shop_address ?? "123 Vape Street, BGC, Taguig"
  );
  const [currency, setCurrency] = useState(s.currency ?? "PHP");
  const [taxRate, setTaxRate] = useState(String(s.tax_rate ?? "12"));

  // Payment settings
  const [gcashEnabled, setGcashEnabled] = useState(s.gcash_enabled ?? true);
  const [mayaEnabled, setMayaEnabled] = useState(s.maya_enabled ?? true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(
    s.bank_transfer_enabled ?? true
  );
  const [codEnabled, setCodEnabled] = useState(s.allow_cod ?? true);
  const [gcashNumber, setGcashNumber] = useState(
    s.gcash_number ?? "0917 123 4567"
  );
  const [mayaNumber, setMayaNumber] = useState(
    s.maya_number ?? "0918 234 5678"
  );
  const [bankName, setBankName] = useState(s.bank_name ?? "BDO");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    s.bank_account_number ?? "1234567890"
  );
  const [bankAccountName, setBankAccountName] = useState(
    s.bank_account_name ?? "13th Vapour Lounge Inc."
  );

  // Notification settings
  const [emailOrderNotifs, setEmailOrderNotifs] = useState(
    s.email_order_notifications ?? true
  );
  const [emailLowStockNotifs, setEmailLowStockNotifs] = useState(
    s.email_low_stock_notifications ?? true
  );
  const [emailPaymentNotifs, setEmailPaymentNotifs] = useState(
    s.email_payment_notifications ?? true
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(s.low_stock_threshold ?? "10")
  );
  const [shippingFee, setShippingFee] = useState(
    String(s.shipping_fee ?? "50")
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(s.free_shipping_threshold ?? "0")
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (section?: string) => {
    setIsSaving(true);
    try {
      const result = await updateShopSettings({
        shop_name: shopName,
        shop_email: shopEmail,
        shop_phone: shopPhone,
        shop_address: shopAddress,
        currency,
        tax_rate: parseFloat(taxRate) || 0,
        gcash_enabled: gcashEnabled,
        gcash_number: gcashNumber,
        maya_enabled: mayaEnabled,
        maya_number: mayaNumber,
        bank_transfer_enabled: bankTransferEnabled,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        allow_cod: codEnabled,
        email_order_notifications: emailOrderNotifs,
        email_low_stock_notifications: emailLowStockNotifs,
        email_payment_notifications: emailPaymentNotifs,
        low_stock_threshold: parseInt(lowStockThreshold) || 10,
        shipping_fee: parseFloat(shippingFee) || 50,
        free_shipping_threshold: parseFloat(freeShippingThreshold) || 0,
      });
      if (result?.success) {
        toast.success(
          section ? `${section} settings saved` : "Settings saved successfully"
        );
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Store className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" /> Shop Information
              </CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopEmail">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="shopEmail"
                      className="pl-10"
                      value={shopEmail}
                      onChange={(e) => setShopEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopPhone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="shopPhone"
                      className="pl-10"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="shopAddress"
                      className="pl-10"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHP">Philippine Peso (₱)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave("General")} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> Shipping
              </CardTitle>
              <CardDescription>
                Configure shipping fees for online orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">Flat Shipping Fee (₱)</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Charged on every online order
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">
                    Free Shipping Above (₱)
                  </Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to 0 to always charge shipping
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleSave("Shipping")}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          <BusinessHoursManager />

          {/* Feature Toggles */}
          <FeatureToggles />

          {/* Legal Documents */}
          <LegalDocumentsManager />
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Methods
                </CardTitle>
                <CardDescription>
                  Configure accepted payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* GCash */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                        GC
                      </div>
                      <span className="font-medium">GCash</span>
                    </div>
                    <Button
                      variant={gcashEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGcashEnabled(!gcashEnabled)}
                    >
                      {gcashEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  {gcashEnabled && (
                    <div>
                      <Label>GCash Number</Label>
                      <Input
                        value={gcashNumber}
                        onChange={(e) => setGcashNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Maya */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                        M
                      </div>
                      <span className="font-medium">Maya</span>
                    </div>
                    <Button
                      variant={mayaEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMayaEnabled(!mayaEnabled)}
                    >
                      {mayaEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  {mayaEnabled && (
                    <div>
                      <Label>Maya Number</Label>
                      <Input
                        value={mayaNumber}
                        onChange={(e) => setMayaNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                        BT
                      </div>
                      <span className="font-medium">Bank Transfer</span>
                    </div>
                    <Button
                      variant={bankTransferEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setBankTransferEnabled(!bankTransferEnabled)
                      }
                    >
                      {bankTransferEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  {bankTransferEnabled && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Account Name</Label>
                        <Input
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* COD */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                        ₱
                      </div>
                      <span className="font-medium">Cash on Delivery</span>
                    </div>
                    <Button
                      variant={codEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCodEnabled(!codEnabled)}
                    >
                      {codEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => handleSave("Payment")}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Payment Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Email Notifications
              </CardTitle>
              <CardDescription>
                Manage what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="font-medium">New Order Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when a customer places an order
                    </div>
                  </div>
                  <Button
                    variant={emailOrderNotifs ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailOrderNotifs(!emailOrderNotifs)}
                  >
                    {emailOrderNotifs ? "On" : "Off"}
                  </Button>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="font-medium">Low Stock Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when products fall below threshold
                    </div>
                  </div>
                  <Button
                    variant={emailLowStockNotifs ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailLowStockNotifs(!emailLowStockNotifs)}
                  >
                    {emailLowStockNotifs ? "On" : "Off"}
                  </Button>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="font-medium">Payment Verification</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when payment proof is submitted
                    </div>
                  </div>
                  <Button
                    variant={emailPaymentNotifs ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailPaymentNotifs(!emailPaymentNotifs)}
                  >
                    {emailPaymentNotifs ? "On" : "Off"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSave("Notification")}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security & Access
              </CardTitle>
              <CardDescription>
                Manage security settings for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-1">Change Password</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Update your admin account password
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label>New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label>Confirm Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-1">
                    Two-Factor Authentication
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Add an extra layer of security to your account
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-1">Active Sessions</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Manage devices logged into your account
                  </div>
                  <div className="text-sm p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-muted-foreground">
                          macOS · Chrome
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
