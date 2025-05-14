"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { getBrandingSettings, updateBrandingSettings, uploadLogo, generateImage } from "@/lib/api/settings";

const brandingFormSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  logo: z.string().nullable(),
  favicon: z.string().nullable(),
  customDomain: z.string().nullable(),
  mascot: z.string().nullable(),
  theme: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
  }),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

interface BrandingSettingsProps {
  projectId: string;
}

export function BrandingSettings({ projectId }: BrandingSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isGeneratingMascot, setIsGeneratingMascot] = useState(false);
  const [logoPrompt, setLogoPrompt] = useState("");
  const [mascotPrompt, setMascotPrompt] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [mascotFile, setMascotFile] = useState<File | null>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      name: "",
      logo: null,
      favicon: null,
      customDomain: null,
      mascot: null,
      theme: {
        primaryColor: "#007bff",
        secondaryColor: "#6c757d",
        accentColor: "#ffc107",
      },
    },
  });

  useEffect(() => {
    const loadBrandingSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getBrandingSettings(projectId);
        form.reset({
          name: data.name,
          logo: data.logo,
          favicon: data.favicon,
          customDomain: data.customDomain || null,
          mascot: data.mascot || null,
          theme: data.theme,
        });
      } catch (error) {
        toast.error("Failed to load branding settings");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandingSettings();
  }, [projectId, form]);

  const onSubmit = async (data: BrandingFormValues) => {
    try {
      setIsSaving(true);

      // Handle logo upload if a file was selected
      if (logoFile) {
        const uploadResult = await uploadLogo(projectId, logoFile);
        data.logo = uploadResult.url;
      }

      // Handle favicon upload if a file was selected
      if (faviconFile) {
        const formData = new FormData();
        formData.append('file', faviconFile);
        const response = await fetch(`/api/projects/${projectId}/settings/branding/favicon`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload favicon");
        }
        const result = await response.json();
        data.favicon = result.url;
      }

      // Handle mascot upload if a file was selected
      if (mascotFile) {
        const formData = new FormData();
        formData.append('file', mascotFile);
        const response = await fetch(`/api/projects/${projectId}/settings/branding/mascot`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload mascot");
        }
        const result = await response.json();
        data.mascot = result.url;
      }

      // Update branding settings
      await updateBrandingSettings({
        ...data,
        projectId,
      });

      toast.success("Branding settings updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update branding settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
      // Create a preview URL
      const url = URL.createObjectURL(event.target.files[0]);
      form.setValue("logo", url);
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFaviconFile(event.target.files[0]);
      // Create a preview URL
      const url = URL.createObjectURL(event.target.files[0]);
      form.setValue("favicon", url);
    }
  };

  const handleMascotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMascotFile(event.target.files[0]);
      // Create a preview URL
      const url = URL.createObjectURL(event.target.files[0]);
      form.setValue("mascot", url);
    }
  };

  const handleGenerateLogo = async () => {
    if (!logoPrompt) {
      toast.error("Please enter a prompt for logo generation");
      return;
    }

    try {
      setIsGeneratingLogo(true);
      const result = await generateImage(projectId, logoPrompt, 'logo');
      form.setValue("logo", result.url);
      toast.success("Logo generated successfully");
    } catch (error) {
      toast.error("Failed to generate logo");
      console.error(error);
    } finally {
      setIsGeneratingLogo(false);
      setLogoPrompt("");
    }
  };

  const handleGenerateMascot = async () => {
    if (!mascotPrompt) {
      toast.error("Please enter a prompt for mascot generation");
      return;
    }

    try {
      setIsGeneratingMascot(true);
      const result = await generateImage(projectId, mascotPrompt, 'mascot');
      form.setValue("mascot", result.url);
      toast.success("Mascot generated successfully");
    } catch (error) {
      toast.error("Failed to generate mascot");
      console.error(error);
    } finally {
      setIsGeneratingMascot(false);
      setMascotPrompt("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Project Identity</CardTitle>
              <CardDescription>Update your project's name and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the name that will appear throughout your project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-sm font-medium mb-2">Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="border rounded-md overflow-hidden w-24 h-24 flex items-center justify-center bg-background">
                        {form.watch("logo") ? (
                          <img src={form.watch("logo")} alt="Logo" className="max-w-full max-h-full" />
                        ) : (
                          <div className="text-muted-foreground text-sm">No logo</div>
                        )}
                      </div>
                      <Label htmlFor="logo" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </div>
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleLogoChange}
                        />
                      </Label>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>Recommended: 512x512px PNG or SVG</p>
                      <p>Max size: 5MB</p>
                    </div>
                  </div>
                  {/* <div className="border rounded-md p-4">
                    <h4 className="text-sm font-medium mb-2">Generate with AI</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Describe your logo..."
                        value={logoPrompt}
                        onChange={(e) => setLogoPrompt(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGenerateLogo}
                        disabled={isGeneratingLogo}
                      >
                        {isGeneratingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Logo
                          </>
                        )}
                      </Button>
                    </div>
                  </div> */}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Favicon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="border rounded-md overflow-hidden w-16 h-16 flex items-center justify-center bg-background">
                        {form.watch("favicon") ? (
                          <img src={form.watch("favicon")} alt="Favicon" className="max-w-full max-h-full" />
                        ) : (
                          <div className="text-muted-foreground text-sm">No favicon</div>
                        )}
                      </div>
                      <Label htmlFor="favicon" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Upload className="h-4 w-4" />
                          Upload Favicon
                        </div>
                        <input
                          id="favicon"
                          type="file"
                          accept="image/png,image/x-icon,image/svg+xml"
                          className="sr-only"
                          onChange={handleFaviconChange}
                        />
                      </Label>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>Recommended: 32x32px or 64x64px</p>
                      <p>Formats: ICO, PNG or SVG</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          {/* Brand Mascot */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Mascot</CardTitle>
              <CardDescription>Add a mascot to represent your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="border rounded-md overflow-hidden w-32 h-32 flex items-center justify-center bg-background">
                      {form.watch("mascot") ? (
                        <img src={form.watch("mascot")} alt="Mascot" className="max-w-full max-h-full" />
                      ) : (
                        <div className="text-muted-foreground text-sm">No mascot</div>
                      )}
                    </div>
                    <Label htmlFor="mascot" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Upload className="h-4 w-4" />
                        Upload Mascot
                      </div>
                      <input
                        id="mascot"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleMascotChange}
                      />
                    </Label>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Recommended: 512x512px PNG with transparent background</p>
                    <p>Max size: 5MB</p>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Generate with AI</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Describe your mascot..."
                      value={mascotPrompt}
                      onChange={(e) => setMascotPrompt(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerateMascot}
                      disabled={isGeneratingMascot}
                    >
                      {isGeneratingMascot ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Mascot
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>Customize the colors for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="theme.primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Primary Color</FormLabel>
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            {...field}
                            type="color"
                            className="w-10 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Used for buttons and focus elements</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme.secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Secondary Color</FormLabel>
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            {...field}
                            type="color"
                            className="w-10 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Used for secondary UI elements</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme.accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Accent Color</FormLabel>
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            {...field}
                            type="color"
                            className="w-10 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Used for highlights and accents</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <div className="border rounded-md p-6">
                  <div
                    className="w-full h-24 rounded-md mb-4"
                    style={{
                      background: `linear-gradient(to right, ${form.watch('theme.primaryColor')}, ${form.watch('theme.secondaryColor')})`,
                    }}
                  ></div>
                  <div className="flex flex-wrap gap-2">
                    <div
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: form.watch('theme.primaryColor') }}
                    >
                      Primary Button
                    </div>
                    <div
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: form.watch('theme.secondaryColor') }}
                    >
                      Secondary Button
                    </div>
                    <div
                      className="px-4 py-2 rounded-md"
                      style={{
                        backgroundColor: form.watch('theme.accentColor'),
                        color: isLightColor(form.watch('theme.accentColor')) ? 'black' : 'white',
                      }}
                    >
                      Accent Button
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          {/* Custom Domain */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Configure a custom domain for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="app.yourdomain.com" />
                    </FormControl>
                    <FormDescription>
                      Enter your domain without http:// or https://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="p-4 bg-muted rounded-md text-sm space-y-3">
                <p className="font-medium">Follow these steps to configure your domain:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Add a CNAME record pointing to <code className="text-xs bg-background p-1 rounded">app.dabao.in</code></li>
                  <li>Wait for DNS to propagate (can take up to 48 hours)</li>
                  <li>We'll automatically provision an SSL certificate</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 justify-between">
              <Button variant="outline" type="button" onClick={() => window.open("https://docs.dabao.in/custom-domains", "_blank")}>
                View Domain Documentation
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  // Remove the hash if it exists
  color = color.replace('#', '');
  
  // Parse the color
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if light, false if dark
  return luminance > 0.5;
}