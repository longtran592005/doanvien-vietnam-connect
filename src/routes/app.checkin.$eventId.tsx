import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkinMemberFn, getEventForCheckinFn } from "@/lib/api/checkin.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  Users,
  Keyboard,
  Camera,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/checkin/$eventId")({
  component: CheckinPage,
});

/* ─── Types ─── */
interface CheckinResult {
  success?: boolean;
  error?: string;
  alreadyCheckedIn?: boolean;
  member?: { code: string; fullName: string };
  bonusPoints?: number;
}

function CheckinPage() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch event info
  const {
    data: event,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["checkin-event", eventId],
    queryFn: () => getEventForCheckinFn({ data: { eventId } }),
  });

  // States
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [manualCode, setManualCode] = useState("");
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<
    { code: string; name: string; time: string }[]
  >([]);

  // Camera scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Check-in mutation
  const checkinMut = useMutation({
    mutationFn: (memberCode: string) =>
      checkinMemberFn({ data: { eventId, memberCode } }),
    onSuccess: (res: any) => {
      setLastResult(res);
      if (res.success) {
        toast.success(
          `✅ ${res.member.fullName} (${res.member.code}) — +${res.bonusPoints} điểm RL`,
        );
        setRecentCheckins((prev) => [
          {
            code: res.member.code,
            name: res.member.fullName,
            time: new Date().toLocaleTimeString("vi"),
          },
          ...prev,
        ]);
        setManualCode("");
        refetch(); // refresh attended count
      } else if (res.alreadyCheckedIn) {
        toast.warning(res.error);
      } else {
        toast.error(res.error);
      }
    },
  });

  const handleManualCheckin = () => {
    if (!manualCode.trim()) return;
    checkinMut.mutate(manualCode.trim());
  };

  // Camera scanning using native getUserMedia + simple QR detection
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      // Start scanning loop
      scanLoop();
    } catch (err: any) {
      toast.error(
        "Không thể truy cập camera: " + (err.message || "Kiểm tra quyền"),
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanLoop = async () => {
    // Use BarcodeDetector API if available (Chrome/Edge), otherwise fall back to manual input
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });
      const interval = setInterval(async () => {
        if (!videoRef.current || !streamRef.current) {
          clearInterval(interval);
          return;
        }
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            // The QR contains a URL like .../app/checkin/xxx — extract code from query or try as member code
            // But our QR code for members will just be the member code
            // For simplicity, extract member code from the QR payload
            if (raw && !checkinMut.isPending) {
              // If it's a URL, it's the check-in page URL (not a member code)
              // Members will show their member code as QR
              const memberCode = raw.startsWith("http")
                ? new URL(raw).searchParams.get("code") || raw
                : raw;
              checkinMut.mutate(memberCode);
            }
          }
        } catch {}
      }, 800);
    } else {
      toast.info(
        "Trình duyệt không hỗ trợ quét QR. Vui lòng nhập mã sinh viên thủ công.",
      );
      setMode("manual");
      stopCamera();
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertTriangle className="size-12 text-amber-500" />
        <p className="text-lg font-medium">Sự kiện không tồn tại</p>
        <Button asChild variant="outline">
          <Link to="/app/events">
            <ArrowLeft className="size-4 mr-1" /> Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link to="/app/events">
          <ArrowLeft className="size-4" /> Quay lại Hoạt động
        </Link>
      </Button>

      {/* Event Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <QrCode className="size-5 text-primary" />
                Điểm danh sự kiện
              </CardTitle>
              <CardDescription className="text-base mt-1 font-medium text-foreground">
                {event.title}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm px-3 py-1">
              {event.attendedCount} / {event.registeredCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {event.startAt.replace("T", " ")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {event.attendedCount} đã điểm danh
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mode Switcher */}
      <div className="flex gap-2">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          className="flex-1"
          onClick={() => {
            setMode("manual");
            stopCamera();
          }}
        >
          <Keyboard className="size-4 mr-1.5" /> Nhập mã thủ công
        </Button>
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          className="flex-1"
          onClick={() => {
            setMode("camera");
            startCamera();
          }}
        >
          <Camera className="size-4 mr-1.5" /> Quét mã QR
        </Button>
      </div>

      {/* Manual Input */}
      {mode === "manual" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Nhập mã sinh viên (VD: SV20210001)"
                className="text-lg font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualCheckin();
                }}
                autoFocus
              />
              <Button
                onClick={handleManualCheckin}
                disabled={checkinMut.isPending || !manualCode.trim()}
                size="lg"
              >
                {checkinMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ScanLine className="size-4 mr-1" />
                )}
                Check-in
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Nhập mã sinh viên và nhấn Enter hoặc nút Check-in. Tự động cộng{" "}
              <strong>+5 điểm rèn luyện</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Camera Scanner */}
      {mode === "camera" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary rounded-xl animate-pulse" />
                </div>
              )}
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80">
                  <Camera className="size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nhấn nút bên trên để bật camera
                  </p>
                </div>
              )}
            </div>
            {scanning && (
              <div className="flex justify-center">
                <Button variant="destructive" size="sm" onClick={stopCamera}>
                  Tắt camera
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Hướng camera vào mã QR của đoàn viên để tự động điểm danh.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Last Result */}
      {lastResult && (
        <Card
          className={
            lastResult.success
              ? "border-green-500/30 bg-green-500/5"
              : lastResult.alreadyCheckedIn
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-destructive/30 bg-destructive/5"
          }
        >
          <CardContent className="p-4 flex items-center gap-3">
            {lastResult.success ? (
              <>
                <CheckCircle2 className="size-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-700">
                    ✅ {lastResult.member?.fullName}
                  </p>
                  <p className="text-sm text-green-600">
                    Mã: {lastResult.member?.code} — Đã cộng{" "}
                    <strong>+{lastResult.bonusPoints} điểm RL</strong>
                  </p>
                </div>
                <Sparkles className="size-6 text-green-500 ml-auto animate-bounce" />
              </>
            ) : (
              <>
                <AlertTriangle
                  className={`size-8 flex-shrink-0 ${lastResult.alreadyCheckedIn ? "text-amber-500" : "text-destructive"}`}
                />
                <p
                  className={`text-sm ${lastResult.alreadyCheckedIn ? "text-amber-700" : "text-destructive"}`}
                >
                  {lastResult.error}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {recentCheckins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" /> Vừa điểm danh ({recentCheckins.length}
              )
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {recentCheckins.map((c, i) => (
                <div
                  key={`${c.code}-${i}`}
                  className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                >
                  <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground w-28">
                    {c.code}
                  </span>
                  <span className="font-medium flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attended list from server */}
      {event.attendedMembers && event.attendedMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> Danh sách đã điểm
              danh ({event.attendedMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {event.attendedMembers.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 text-sm py-1 px-2"
                >
                  <span className="font-mono text-xs text-muted-foreground w-28">
                    {m.code}
                  </span>
                  <span>{m.fullName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
