"use client";

import { clockIn, clockOut } from "@/app/actions/staff";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftRecord = {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  total_sales: number | null;
  transaction_count: number | null;
  notes: string | null;
  status: string | null;
  register_id: string;
  staff_id: string;
  staff: { first_name: string; last_name: string } | null;
  register: { name: string; location?: string | null } | null;
};

type RegisterRecord = {
  id: string;
  name: string;
  location: string | null;
};

type StaffRecord = {
  id: string;
  first_name: string;
  last_name: string;
};

export interface ShiftsPageProps {
  isAdmin: boolean;
  userId: string;
  userName: string;
  activeShift: ShiftRecord | null;
  shifts: ShiftRecord[];
  registers: RegisterRecord[];
  staffList: StaffRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(
  clockInStr: string | null,
  clockOutStr?: string | null
): string {
  if (!clockInStr) return "—";
  const start = new Date(clockInStr).getTime();
  const end = clockOutStr ? new Date(clockOutStr).getTime() : Date.now();
  const ms = end - start;
  if (ms < 0) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function formatDateTime(dt: string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
}

function ShiftStatusBadge({ shift }: { shift: ShiftRecord }) {
  if (!shift.clock_out) {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-200">
        Active
      </Badge>
    );
  }
  if (shift.cash_difference !== null && shift.cash_difference < 0) {
    return <Badge variant="destructive">Short</Badge>;
  }
  if (shift.cash_difference !== null && shift.cash_difference > 0) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
        Over
      </Badge>
    );
  }
  return <Badge variant="secondary">Closed</Badge>;
}

// Live duration that ticks every minute whilst the shift is active
function LiveDuration({ clockIn }: { clockIn: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return <span>{formatDuration(clockIn)}</span>;
}

// ─── Staff: Clock-In Form ─────────────────────────────────────────────────────

function ClockInForm({
  registers,
  onSuccess,
}: {
  registers: RegisterRecord[];
  onSuccess: () => void;
}) {
  const [registerId, setRegisterId] = useState("");
  const [openingCash, setOpeningCash] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registerId) {
      toast.error("Please select a register");
      return;
    }
    const cash = parseFloat(openingCash);
    if (isNaN(cash) || cash < 0) {
      toast.error("Please enter a valid opening cash amount");
      return;
    }

    setLoading(true);
    const result = await clockIn({
      register_id: registerId,
      opening_cash: cash,
    });
    setLoading(false);

    if (result.success) {
      toast.success(result.message ?? "Clocked in successfully");
      onSuccess();
    } else {
      toast.error(result.message ?? "Failed to clock in");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Register</Label>
        <Select value={registerId} onValueChange={setRegisterId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a register" />
          </SelectTrigger>
          <SelectContent>
            {registers.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
                {r.location ? ` — ${r.location}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Opening Cash (₱)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        <LogIn className="h-4 w-4 mr-2" />
        {loading ? "Clocking in…" : "Clock In"}
      </Button>
    </form>
  );
}

// ─── Staff: Clock-Out Form ────────────────────────────────────────────────────

function ClockOutForm({
  shiftId,
  onSuccess,
}: {
  shiftId: string;
  onSuccess: () => void;
}) {
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cash = parseFloat(closingCash);
    if (isNaN(cash) || cash < 0) {
      toast.error("Please enter a valid closing cash amount");
      return;
    }

    setLoading(true);
    const result = await clockOut({
      shift_id: shiftId,
      closing_cash: cash,
      notes: notes || undefined,
    });
    setLoading(false);

    if (result.success) {
      toast.success(result.message ?? "Clocked out successfully");
      onSuccess();
    } else {
      toast.error(result.message ?? "Failed to clock out");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Closing Cash (₱)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={closingCash}
          onChange={(e) => setClosingCash(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="Any notes about the shift…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        disabled={loading}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {loading ? "Clocking out…" : "Clock Out"}
      </Button>
    </form>
  );
}

// ─── Shifts Table ─────────────────────────────────────────────────────────────

function ShiftsTable({
  shifts,
  showStaff,
}: {
  shifts: ShiftRecord[];
  showStaff: boolean;
}) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No shifts found.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showStaff && <TableHead>Staff</TableHead>}
            <TableHead>Register</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Opening</TableHead>
            <TableHead>Closing</TableHead>
            <TableHead>Difference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              {showStaff && (
                <TableCell className="font-medium whitespace-nowrap">
                  {shift.staff
                    ? `${shift.staff.first_name} ${shift.staff.last_name}`
                    : "—"}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap">
                {shift.register?.name ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDateTime(shift.clock_in)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDateTime(shift.clock_out)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {!shift.clock_out && shift.clock_in ? (
                  <span className="text-green-600 font-medium">
                    <LiveDuration clockIn={shift.clock_in} />
                  </span>
                ) : (
                  formatDuration(shift.clock_in, shift.clock_out)
                )}
              </TableCell>
              <TableCell>{formatCurrency(shift.opening_cash)}</TableCell>
              <TableCell>{formatCurrency(shift.closing_cash)}</TableCell>
              <TableCell>
                {shift.cash_difference != null ? (
                  <span
                    className={
                      shift.cash_difference < 0
                        ? "text-red-600 font-medium"
                        : shift.cash_difference > 0
                          ? "text-blue-600 font-medium"
                          : "text-green-600"
                    }
                  >
                    {shift.cash_difference >= 0 ? "+" : ""}
                    {formatCurrency(shift.cash_difference)}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <ShiftStatusBadge shift={shift} />
              </TableCell>
              <TableCell className="max-w-45 truncate text-sm text-muted-foreground">
                {shift.notes || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShiftsPage({
  isAdmin,
  userName,
  activeShift,
  shifts,
  registers,
  staffList,
}: ShiftsPageProps) {
  const router = useRouter();

  // ── Admin filters ────────────────────────────────────────────────────────
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const refresh = () => router.refresh();

  // ── Derived data ─────────────────────────────────────────────────────────
  const activeShifts = shifts.filter((s) => !s.clock_out);

  const today = new Date().toDateString();
  const todayShifts = shifts.filter(
    (s) => s.clock_in && new Date(s.clock_in).toDateString() === today
  );

  const filteredShifts = shifts.filter((s) => {
    if (filterStaff !== "all" && s.staff_id !== filterStaff) return false;
    if (filterDateFrom && s.clock_in && s.clock_in < filterDateFrom)
      return false;
    if (filterDateTo && s.clock_in && s.clock_in > filterDateTo + "T23:59:59")
      return false;
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STAFF VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Shift</h1>
          <p className="text-muted-foreground">Welcome, {userName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock In / Out Card */}
          <div className="lg:col-span-1">
            {activeShift ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Clock className="h-5 w-5" />
                    Shift Active
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    You are currently clocked in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Register</span>
                      <p className="font-medium">
                        {activeShift.register?.name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clocked in</span>
                      <p className="font-medium">
                        {formatDateTime(activeShift.clock_in)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration</span>
                      <p className="font-semibold text-green-700">
                        {activeShift.clock_in && (
                          <LiveDuration clockIn={activeShift.clock_in} />
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Opening cash
                      </span>
                      <p className="font-medium">
                        {formatCurrency(activeShift.opening_cash)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <ClockOutForm
                      shiftId={activeShift.id}
                      onSuccess={refresh}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Clock In
                  </CardTitle>
                  <CardDescription>Start your shift</CardDescription>
                </CardHeader>
                <CardContent>
                  {registers.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <AlertCircle className="h-4 w-4" />
                      No active registers found. Ask an admin to set one up.
                    </div>
                  ) : (
                    <ClockInForm registers={registers} onSuccess={refresh} />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Shifts</CardDescription>
                <CardTitle className="text-3xl">{shifts.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Shifts This Week</CardDescription>
                <CardTitle className="text-3xl">
                  {
                    shifts.filter((s) => {
                      if (!s.clock_in) return false;
                      const d = new Date(s.clock_in);
                      const now = new Date();
                      const weekAgo = new Date(now.getTime() - 7 * 86400000);
                      return d >= weekAgo;
                    }).length
                  }
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Shift history */}
        <Card>
          <CardHeader>
            <CardTitle>Shift History</CardTitle>
            <CardDescription>Your recent shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftsTable shifts={shifts} showStaff={false} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staff Shifts</h1>
        <p className="text-muted-foreground">
          Monitor clock-ins, clock-outs, and cash reconciliation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Active Now</CardDescription>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {activeShifts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Today's Shifts</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayShifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Cash Discrepancies Today</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {
                todayShifts.filter(
                  (s) => s.cash_difference != null && s.cash_difference !== 0
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active shifts */}
      {activeShifts.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Clock className="h-5 w-5" />
              Currently Clocked In ({activeShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {shift.staff
                        ? `${shift.staff.first_name} ${shift.staff.last_name}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shift.register?.name}
                    </p>
                    <p className="text-xs text-green-700 font-medium mt-0.5">
                      {shift.clock_in && (
                        <LiveDuration clockIn={shift.clock_in} />
                      )}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border border-green-200 shrink-0">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shifts</CardTitle>
          <CardDescription>
            Full shift log with cash reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm">Staff</Label>
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm">From</Label>
              <Input
                type="date"
                className="w-40"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm">To</Label>
              <Input
                type="date"
                className="w-40"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            {(filterStaff !== "all" || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStaff("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
              >
                Clear
              </Button>
            )}
            <p className="text-sm text-muted-foreground self-center ml-auto">
              {filteredShifts.length} shift
              {filteredShifts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <ShiftsTable shifts={filteredShifts} showStaff={true} />
        </CardContent>
      </Card>
    </div>
  );
}
