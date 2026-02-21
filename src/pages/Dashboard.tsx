import { useState, useEffect } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Users, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { activeBusiness } = useBusiness();
  const [stats, setStats] = useState({ totalGave: 0, totalReceived: 0, customerCount: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!activeBusiness) return;

    const fetchStats = async () => {
      const [txRes, custRes] = await Promise.all([
        supabase.from("transactions").select("type, amount").eq("business_id", activeBusiness.id),
        supabase.from("customers").select("id", { count: "exact" }).eq("business_id", activeBusiness.id),
      ]);

      let totalGave = 0, totalReceived = 0;
      txRes.data?.forEach((t) => {
        if (t.type === "gave") totalGave += Number(t.amount);
        else totalReceived += Number(t.amount);
      });

      setStats({
        totalGave,
        totalReceived,
        customerCount: custRes.count || 0,
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, customers(name)")
        .eq("business_id", activeBusiness.id)
        .order("transaction_date", { ascending: false })
        .limit(5);
      setRecentTransactions(data || []);
    };

    fetchStats();
    fetchRecent();
  }, [activeBusiness]);

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">No Business Selected</h2>
        <p className="text-muted-foreground">Create or select a business from the menu above to get started.</p>
      </div>
    );
  }

  const netBalance = stats.totalReceived - stats.totalGave;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">{activeBusiness.name}</h1>
        <p className="text-muted-foreground">Business Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-received/10 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-received" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">You'll Get</p>
            <p className="text-xl font-heading font-bold text-received">₹{stats.totalGave.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gave/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-gave" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">You'll Give</p>
            <p className="text-xl font-heading font-bold text-gave">₹{stats.totalReceived.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <p className={`text-xl font-heading font-bold ${netBalance >= 0 ? "text-received" : "text-gave"}`}>
              ₹{Math.abs(netBalance).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Users className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Customers</p>
            <p className="text-xl font-heading font-bold">{stats.customerCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              No transactions yet. Add customers and start recording transactions.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
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
                      <p className="font-medium text-sm">{tx.customers?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || (tx.type === "gave" ? "You gave" : "You received")}
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
    </div>
  );
};

export default Dashboard;
