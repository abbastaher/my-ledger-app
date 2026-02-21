import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { BookOpen, LayoutDashboard, Users, FileText, Plus, LogOut, ChevronDown, Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const { businesses, activeBusiness, setActiveBusiness, refetch } = useBusiness();
  const location = useLocation();
  const { toast } = useToast();
  const [showNewBusiness, setShowNewBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [creating, setCreating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  const handleCreateBusiness = async () => {
    if (!newBusinessName.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("businesses").insert({
      name: newBusinessName.trim(),
      owner_id: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business created!" });
      setNewBusinessName("");
      setShowNewBusiness(false);
      refetch();
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-md bg-card/95">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground hidden sm:block">KhataBook</span>
            </Link>

            {/* Business Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 ml-2 max-w-[160px]">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{activeBusiness?.name || "Select Business"}</span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {businesses.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => setActiveBusiness(b)}
                    className={activeBusiness?.id === b.id ? "bg-accent" : ""}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    {b.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNewBusiness(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Business
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 ml-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border p-2 bg-card animate-slide-up">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 mb-1"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </nav>
        )}
      </header>

      <main className="container px-4 py-6 max-w-4xl">{children}</main>

      {/* New Business Dialog */}
      <Dialog open={showNewBusiness} onOpenChange={setShowNewBusiness}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                placeholder="e.g. My Shop"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBusiness(false)}>Cancel</Button>
            <Button onClick={handleCreateBusiness} disabled={creating || !newBusinessName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppLayout;
