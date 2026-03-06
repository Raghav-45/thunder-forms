"use client"

import * as React from "react"
import {
  Link,
  Settings,
  Shield,
  Split,
  Bell,
  Palette,
  Search,
  Webhook,
  Plus,
  Trash2,
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
import { Switch } from "@/components/ui/switch"
import { useFormStore } from "@/components/FormBuilder/store"
import { DatePickerWithPresets } from "@/components/date-picker-with-presets"

const data = {
  nav: [
    { name: "Access & Control", icon: Shield },
    { name: "Notifications", icon: Bell },
    { name: "Integrations", icon: Webhook },
    { name: "Appearance", icon: Palette },
    { name: "SEO", icon: Search },
    { name: "Navigation", icon: Split },
  ],
}

export function SettingsDialog() {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("Access & Control")
  const { formSettings, setFormSettings } = useFormStore()
  const [newWebhook, setNewWebhook] = React.useState("")

  const addWebhook = () => {
    if (!newWebhook.trim()) return
    setFormSettings({
      ...formSettings,
      webhooks: [...(formSettings.webhooks || []), newWebhook],
    })
    setNewWebhook("")
  }

  const removeWebhook = (index: number) => {
    const newWebhooks = [...(formSettings.webhooks || [])]
    newWebhooks.splice(index, 1)
    setFormSettings({
      ...formSettings,
      webhooks: newWebhooks,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4 bg-lime-400 text-black hover:bg-lime-500 hover:text-black border-none font-medium">
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
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Password Protection</Label>
                        <p className="text-xs text-muted-foreground">
                          Require a password to access the form.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {formSettings.password && (
                          <Input 
                             className="w-40 h-8" 
                             type="text" 
                             placeholder="Password"
                             value={formSettings.password}
                             onChange={(e) => setFormSettings({...formSettings, password: e.target.value})}
                          />
                        )}
                         <Switch
                          checked={!!formSettings.password}
                          onCheckedChange={(checked) =>
                            setFormSettings({ ...formSettings, password: checked ? 'secret' : undefined })
                          }
                        />
                      </div>
                    </div>

                     <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Spam Protection</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable invisible honeypot to prevent bot submissions.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.isSpamProtectionEnabled}
                        onCheckedChange={(checked) =>
                          setFormSettings({ ...formSettings, isSpamProtectionEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Limit 1 Response per IP</Label>
                        <p className="text-xs text-muted-foreground">
                          Restrict users to a single submission based on their IP address.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.isIpLimitEnabled}
                        onCheckedChange={(checked) =>
                          setFormSettings({ ...formSettings, isIpLimitEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- Notifications --- */}
              {activeTab === "Notifications" && (
                <div className="space-y-6">
                   <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground text-sm">
                      Configure email alerts for you and your respondents.
                    </p>
                  </div>

                  <div className="grid gap-6">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Me</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive an email notification for every new submission.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.emailNotifications?.enabled}
                        onCheckedChange={(checked) =>
                          setFormSettings({
                            ...formSettings,
                            emailNotifications: {
                              ...formSettings.emailNotifications!,
                              enabled: checked,
                            },
                          })
                        }
                      />
                    </div>

                     <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Respondent</Label>
                        <p className="text-xs text-muted-foreground">
                          Send a receipt copy to the person who filled out the form.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.emailNotifications?.notifyRespondent}
                        onCheckedChange={(checked) =>
                          setFormSettings({
                            ...formSettings,
                            emailNotifications: {
                              ...formSettings.emailNotifications!,
                              notifyRespondent: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- Integrations --- */}
              {activeTab === "Integrations" && (
                <div className="space-y-6">
                   <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground text-sm">
                      Connect your form to other services via Webhooks.
                    </p>
                  </div>

                  <div className="grid gap-4">
                     <div className="grid gap-2">
                        <Label>Webhooks</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://hooks.slack.com/services/..." 
                            value={newWebhook}
                            onChange={(e) => setNewWebhook(e.target.value)}
                          />
                          <Button onClick={addWebhook} size="icon" variant="secondary"><Plus className="h-4 w-4" /></Button>
                        </div>
                     </div>

                     <div className="space-y-2">
                        {formSettings.webhooks?.map((webhook, idx) => (
                           <div key={idx} className="flex items-center justify-between rounded-md border p-3 text-sm bg-muted/40">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{webhook}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeWebhook(idx)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        ))}
                        {(!formSettings.webhooks || formSettings.webhooks.length === 0) && (
                          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                            No webhooks configured.
                          </div>
                        )}
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
                     <div className="flex items-center justify-between rounded-lg border p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-base">Thunder Mode</Label>
                           <span className="text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded-full">NEW</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enable special animations and confetti effects on submission.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.thunderMode}
                        onCheckedChange={(checked) =>
                          setFormSettings({ ...formSettings, thunderMode: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Show "Powered by"</Label>
                        <p className="text-xs text-muted-foreground">
                          Display the Thunder Forms branding in the footer.
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.branding?.showPoweredBy}
                        onCheckedChange={(checked) =>
                          setFormSettings({
                            ...formSettings,
                            branding: {
                              ...formSettings.branding!,
                              showPoweredBy: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                 </div>
              )}

              {/* --- SEO --- */}
              {activeTab === "SEO" && (
                <div className="space-y-6">
                   <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">SEO & Sharing</h1>
                    <p className="text-muted-foreground text-sm">
                      Customize how your form appears when shared on social media.
                    </p>
                  </div>

                  <div className="grid gap-4">
                     <div className="grid gap-2">
                      <Label htmlFor="ogTitle">Social Title</Label>
                      <Input
                        id="ogTitle"
                        placeholder={formSettings.title}
                        value={formSettings.seo?.ogTitle || ''}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            seo: { ...formSettings.seo, ogTitle: e.target.value },
                          })
                        }
                      />
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="ogDesc">Social Description</Label>
                      <Input
                        id="ogDesc"
                        placeholder={formSettings.description || "Check out this form..."}
                        value={formSettings.seo?.ogDescription || ''}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            seo: { ...formSettings.seo, ogDescription: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- Navigation --- */}
              {activeTab === "Navigation" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">
                      Navigation
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Manage where users go after submitting the form.
                    </p>
                  </div>

                  <div className="grid gap-4 py-4">
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
