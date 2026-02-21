import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomerLedger = () => {
  const { id } = useParams<{ id: string }>();
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [txType, setTxType] = useState<"gave" | "received">("gave");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    if (!id || !activeBusiness) return;

    const [custRes, txRes] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", id)
        .eq("business_id", activeBusiness.id)
        .order("transaction_date", { ascending: false }),
    ]);

    if (custRes.data) setCustomer(custRes.data);
    if (txRes.data) setTransactions(txRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [id, activeBusiness]);

  const handleAddTransaction = async () => {
    if (!amount || !activeBusiness || !id) return;
    setAdding(true);

    const { error } = await supabase.from("transactions").insert({
      business_id: activeBusiness.id,
      customer_id: id,
      type: txType,
      amount: parseFloat(amount),
      description: description.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transaction added!" });
      setAmount("");
      setDescription("");
      setShowAdd(false);
      fetchData();
    }
    setAdding(false);
  };

  const totalGave = transactions.filter((t) => t.type === "gave").reduce((s, t) => s + Number(t.amount), 0);
  const totalReceived = transactions.filter((t) => t.type === "received").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalReceived - totalGave;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">{customer?.name || "Loading..."}</h1>
          {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">You Gave</p>
            <p className="font-heading font-bold text-gave">₹{totalGave.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">You Got</p>
            <p className="font-heading font-bold text-received">₹{totalReceived.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`font-heading font-bold ${balance >= 0 ? "text-received" : "text-gave"}`}>
              ₹{Math.abs(balance).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="border-gave text-gave hover:bg-gave hover:text-gave-foreground"
          onClick={() => { setTxType("gave"); setShowAdd(true); }}
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          You Gave
        </Button>
        <Button
          variant="outline"
          className="border-received text-received hover:bg-received hover:text-received-foreground"
          onClick={() => { setTxType("received"); setShowAdd(true); }}
        >
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          You Got
        </Button>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              No transactions yet. Tap "You Gave" or "You Got" to add one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "gave" ? "bg-gave/10" : "bg-received/10"}`}>
                      {tx.type === "gave" ? (
                        <ArrowUpRight className="w-4 h-4 text-gave" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-received" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.type === "gave" ? "You gave" : "You got"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {tx.description && ` • ${tx.description}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-heading font-bold ${tx.type === "gave" ? "text-gave" : "text-received"}`}>
                    {tx.type === "gave" ? "-" : "+"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={txType === "gave" ? "text-gave" : "text-received"}>
              {txType === "gave" ? "You Gave Money" : "You Got Money"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What was this for? (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={handleAddTransaction}
              disabled={adding || !amount}
              className={txType === "gave" ? "bg-gave hover:bg-gave/90" : "bg-received hover:bg-received/90"}
            >
              {adding ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerLedger;
