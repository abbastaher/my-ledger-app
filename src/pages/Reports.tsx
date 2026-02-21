import { useState, useEffect } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownLeft, ArrowUpRight, FileText, Download } from "lucide-react";

const Reports = () => {
  const { activeBusiness } = useBusiness();
  const [period, setPeriod] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (!activeBusiness) return;

    const fetchData = async () => {
      let query = supabase
        .from("transactions")
        .select("*, customers(name)")
        .eq("business_id", activeBusiness.id)
        .order("transaction_date", { ascending: false });

      if (period !== "all") {
        const now = new Date();
        let from: Date;
        if (period === "today") {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "week") {
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          from = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        query = query.gte("transaction_date", from.toISOString());
      }

      const { data } = await query;
      setTransactions(data || []);

      const { data: custData } = await supabase
        .from("customers")
        .select("id, name")
        .eq("business_id", activeBusiness.id);
      setCustomers(custData || []);
    };

    fetchData();
  }, [activeBusiness, period]);

  const totalGave = transactions.filter((t) => t.type === "gave").reduce((s, t) => s + Number(t.amount), 0);
  const totalReceived = transactions.filter((t) => t.type === "received").reduce((s, t) => s + Number(t.amount), 0);

  const handleExportCSV = () => {
    const headers = "Date,Customer,Type,Amount,Description\n";
    const rows = transactions
      .map((tx) =>
        `"${new Date(tx.transaction_date).toLocaleDateString("en-IN")}","${tx.customers?.name || ""}","${tx.type}","${tx.amount}","${tx.description || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeBusiness?.name || "report"}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">No Business Selected</h2>
        <p className="text-muted-foreground">Select a business to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">{activeBusiness.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gave/10 flex items-center justify-center mx-auto mb-2">
              <ArrowUpRight className="w-5 h-5 text-gave" />
            </div>
            <p className="text-sm text-muted-foreground">Total Given</p>
            <p className="text-2xl font-heading font-bold text-gave">₹{totalGave.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-received/10 flex items-center justify-center mx-auto mb-2">
              <ArrowDownLeft className="w-5 h-5 text-received" />
            </div>
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-heading font-bold text-received">₹{totalReceived.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* All Transactions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">All Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions for this period.</p>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === "gave" ? "bg-gave/10" : "bg-received/10"}`}>
                      {tx.type === "gave" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-gave" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-received" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.customers?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.transaction_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {tx.description && ` • ${tx.description}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-heading font-bold text-sm ${tx.type === "gave" ? "text-gave" : "text-received"}`}>
                    {tx.type === "gave" ? "-" : "+"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
