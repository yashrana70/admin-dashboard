import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Users, BookOpen, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

type AttendanceRecord = {
  class_date: string;
  topic_type?: string | null;
  total_devotees_joined?: number | null;
  absent_devotees?: number | null;
};

export default function AttendanceAnalytics() {
  const { isAdmin, loading } = useIsAdmin();
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalJoined: 0,
    avgAttendance: 0,
    totalAbsent: 0
  });
  
  useEffect(() => {
    if (!isAdmin) return;
    
    (async () => {
      const { data: attendance, error } = await supabase
        .from("class_attendance")
        .select("*")
        .order("class_date", { ascending: true });
        
      if (error) {
        console.error("Error fetching attendance data:", error);
        return;
      }
      
      if (attendance) {
        setData(attendance);
        
        const totalClasses = attendance.length;
        const totalJoined = attendance.reduce((acc, curr) => acc + (curr.total_devotees_joined || 0), 0);
        const totalAbsent = attendance.reduce((acc, curr) => acc + (curr.absent_devotees || 0), 0);
        const avgAttendance = totalClasses > 0 ? Math.round(totalJoined / totalClasses) : 0;
        
        setStats({ totalClasses, totalJoined, avgAttendance, totalAbsent });
      }
    })();
  }, [isAdmin]);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  // Group data by topic type for Bar Chart
  const topicData = data.reduce((acc: Record<string, { name: string; count: number; joined: number }>, curr) => {
    const type = curr.topic_type || "Unknown";
    if (!acc[type]) acc[type] = { name: type, count: 0, joined: 0 };
    acc[type].count += 1;
    acc[type].joined += (curr.total_devotees_joined || 0);
    return acc;
  }, {});
  const topicChartData = Object.values(topicData);

  // Group data by date for Line Chart (Trend)
  const trendDataMap = data.reduce((acc: Record<string, { date: string; joined: number; absent: number }>, curr) => {
    const d = curr.class_date;
    if (!acc[d]) acc[d] = { date: format(parseISO(d), 'MMM dd'), joined: 0, absent: 0 };
    acc[d].joined += (curr.total_devotees_joined || 0);
    acc[d].absent += (curr.absent_devotees || 0);
    return acc;
  }, {});
  const trendChartData = Object.values(trendDataMap);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Attendance Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin overview of class attendance across all levels.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Classes</p>
                <h3 className="text-3xl font-serif text-blue-600 dark:text-blue-400">{stats.totalClasses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Joined</p>
                <h3 className="text-3xl font-serif text-green-600 dark:text-green-400">{stats.totalJoined}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg per Class</p>
                <h3 className="text-3xl font-serif text-yellow-600 dark:text-yellow-400">{stats.avgAttendance}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Absent</p>
                <h3 className="text-3xl font-serif text-red-600 dark:text-red-400">{stats.totalAbsent}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft border-primary/20">
          <CardHeader>
            <CardTitle className="font-serif">Attendance Trend Over Time</CardTitle>
            <CardDescription>Number of devotees joined vs absent per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="joined" stroke="#22c55e" strokeWidth={3} name="Joined" />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} name="Absent" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-primary/20">
          <CardHeader>
            <CardTitle className="font-serif">Attendance by Topic Type</CardTitle>
            <CardDescription>Total devotees joined per topic category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {topicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="joined" fill="#eab308" radius={[4, 4, 0, 0]} name="Total Joined" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-primary/20 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">Recent Class Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Date</th>
                  <th className="px-4 py-3">Class Level</th>
                  <th className="px-4 py-3">Topic Type</th>
                  <th className="px-4 py-3">Joined / Total</th>
                  <th className="px-4 py-3 rounded-tr-lg">Speaker</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.slice(-10).reverse().map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{new Date(row.class_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-medium text-primary">{row.class_level}</td>
                    <td className="px-4 py-3">{row.topic_type}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 font-semibold">{row.total_devotees_joined}</span> / {row.total_devotees_in_class}
                    </td>
                    <td className="px-4 py-3">{row.speaker || "-"}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No class records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
