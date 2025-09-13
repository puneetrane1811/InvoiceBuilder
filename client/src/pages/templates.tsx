import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Palette } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const createDefaultTemplate = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: "Default Template",
        primaryColor: "#3b82f6",
        isDefault: true,
      };
      const response = await apiRequest("POST", "/api/templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Default template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">PDF Templates</h2>
            <p className="text-muted-foreground">Customize your invoice templates</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-templates"
              />
            </div>
            <Button onClick={() => createDefaultTemplate.mutate()} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 pb-6 overflow-hidden pt-6">
        <Card className="h-full">
          <CardContent className="p-0">
            <div className="px-4 py-3 bg-muted border-b border-border">
              <h3 className="text-sm font-medium text-foreground">All Templates</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Primary Color</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading templates...
                      </TableCell>
                    </TableRow>
                  ) : filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id} className="hover:bg-accent transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-6 h-6 rounded-md border"
                              style={{ backgroundColor: template.primaryColor || '#3b82f6' }}
                            />
                            <p className="text-sm font-medium text-foreground">{template.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{template.primaryColor}</p>
                        </TableCell>
                        <TableCell>
                          {template.isDefault ? (
                            <Badge variant="default">Default</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">
                            {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-template-${template.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-preview-template-${template.id}`}
                            >
                              <Palette className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Creation/Edit coming in future iterations */}
      <div className="px-6 pb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">PDF Template Customization</h3>
            <p className="text-muted-foreground mb-4">
              Full template customization with logo upload, color themes, and layout options coming soon!
            </p>
            <Button variant="outline" disabled>
              Template Editor (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
