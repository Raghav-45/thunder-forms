"use client"

import * as React from "react"
import {
  Link,
  Settings,
  Shield,
  Split,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useFormStore } from "@/features/form-builder/store"
import { DatePickerWithPresets } from "@/features/form-builder/components/date-picker-with-presets"

const data = {
  nav: [
    { name: "Access & Control", icon: Shield },
    { name: "Navigation", icon: Split },
    { name: "Appearance", icon: Settings },
  ],
}

export function SettingsDialog() {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("Access & Control")
  const { formSettings, setFormSettings } = useFormStore()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2 font-medium">
          <Settings className="mr-2 h-4 w-4" />
          Advanced Settings
        </Button>
      </DialogTrigger>
      <DialogContent
        className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px]"
        overlayClassName="bg-black/60 backdrop-blur-md"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your form settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-60 border-r bg-muted/30">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={activeTab === item.name}
                          onClick={() => setActiveTab(item.name)}
                          className="h-10"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[550px] flex-1 flex-col overflow-hidden bg-background">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">

              {/* --- Access & Control --- */}
              {activeTab === "Access & Control" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Access & Control</h1>
                    <p className="text-muted-foreground text-sm">
                      Manage form access, expiration, and submission limits.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="expiresAt">Expiration Date</Label>
                      <DatePickerWithPresets
                        date={formSettings.expiresAt || null}
                        setDate={(e) =>
                          setFormSettings({ ...formSettings, expiresAt: e || undefined })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        The form will automatically close on this date.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="maxSubmission">Max Submission Limit</Label>
                      <Input
                        id="maxSubmission"
                        type="number"
                        placeholder="Unlimited"
                        value={formSettings.maxSubmissions || ''}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            maxSubmissions: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Limit total responses. Leave empty for unlimited.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* --- Appearance --- */}
              {activeTab === "Appearance" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Appearance</h1>
                    <p className="text-muted-foreground text-sm">
                      Customize the look and feel of your form.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="submitButtonText">Submit Button Text</Label>
                      <Input
                        id="submitButtonText"
                        type="text"
                        placeholder="Submit"
                        maxLength={50}
                        value={formSettings.submitButtonText || ''}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            submitButtonText: e.target.value || undefined,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Custom text for the submit button. Defaults to &quot;Submit&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Navigation --- */}
              {activeTab === "Navigation" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Navigation</h1>
                    <p className="text-muted-foreground text-sm">
                      Manage where users go after submitting the form.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="redirectUrl">Redirect URL</Label>
                      <div className="relative">
                        <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="redirectUrl"
                          type="url"
                          placeholder="https://example.com/thank-you"
                          className="pl-9"
                          value={formSettings.redirectUrl || ''}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              redirectUrl: e.target.value,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Users will be redirected to this URL after successful submission.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
