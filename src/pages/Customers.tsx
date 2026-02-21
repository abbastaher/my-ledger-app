import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, UserPlus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

const Customers = () => {
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCustomers = async () => {
    if (!activeBusiness) return;

    const { data: custData } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", activeBusiness.id)
      .order("name");

    if (!custData) return;

    const { data: txData } = await supabase
      .from("transactions")
      .select("customer_id, type, amount")
      .eq("business_id", activeBusiness.id);

    const balanceMap: Record<string, number> = {};
    txData?.forEach((tx) => {
      const key = tx.customer_id;
      if (!balanceMap[key]) balanceMap[key] = 0;
      balanceMap[key] += tx.type === "gave" ? -Number(tx.amount) : Number(tx.amount);
    });

    setCustomers(
      custData.map((c) => ({
        ...c,
        balance: balanceMap[c.id] || 0,
      }))
    );
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeBusiness]);

  const handleAdd = async () => {
    if (!newName.trim() || !activeBusiness) return;
    setAdding(true);
    const { error } = await supabase.from("customers").insert({
      name: newName.trim(),
      phone: newPhone.trim() || null,
      business_id: activeBusiness.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer added!" });
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
      fetchCustomers();
    }
    setAdding(false);
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">No Business Selected</h2>
        <p className="text-muted-foreground">Select a business to manage customers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">{customers.length} total</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            {customers.length === 0
              ? "No customers yet. Add your first customer to start tracking."
              : "No customers match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {customer.balance !== 0 && (
                    <div className="flex items-center gap-1">
                      {customer.balance < 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-gave" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3 text-received" />
                      )}
                      <p className={`font-heading font-bold text-sm ${customer.balance < 0 ? "text-gave" : "text-received"}`}>
                        ₹{Math.abs(customer.balance).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {customer.balance < 0 ? "You'll get" : customer.balance > 0 ? "You'll give" : "Settled"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Customer name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="Phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
              {adding ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
