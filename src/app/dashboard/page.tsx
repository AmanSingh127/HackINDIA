import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Briefcase, Activity, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const sessions = await prisma.interviewSession.findMany({
    include: {
      candidate: true,
      job: true,
      evaluation: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const completed = sessions.filter(s => s.status === "COMPLETED").length;
  const inProgress = sessions.filter(s => s.status === "IN_PROGRESS").length;
  const pending = sessions.filter(s => s.status === "PENDING").length;
  const shortlisted = sessions.filter(s => s.recruiterDecision === "SHORTLISTED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
            <p className="text-slate-400 mt-1">Overview of all candidate interviews</p>
          </div>
          <Link href="/" className="text-sm px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          {[
            { label: "Total Candidates", value: sessions.length, icon: <Users className="text-blue-400" /> },
            { label: "Completed", value: completed, icon: <CheckCircle className="text-green-400" /> },
            { label: "In Progress", value: inProgress, icon: <Activity className="text-indigo-400" /> },
            { label: "Pending", value: pending, icon: <Clock className="text-amber-400" /> },
            { label: "Shortlisted", value: shortlisted, icon: <Briefcase className="text-purple-400" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 font-medium">{stat.label}</span>
                {stat.icon}
              </div>
              <p className="text-4xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Candidates List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold">Recent Interviews</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Candidate</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Role</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Decision</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Score</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{session.candidate.name}</div>
                      <div className="text-sm text-slate-400">{session.candidate.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm">
                        <Briefcase size={14} />
                        {session.job.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session.status === "COMPLETED" && <span className="text-green-400 text-sm font-medium">Completed</span>}
                      {session.status === "IN_PROGRESS" && <span className="text-indigo-400 text-sm font-medium">In Progress</span>}
                      {session.status === "PENDING" && <span className="text-amber-400 text-sm font-medium">Pending</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          session.recruiterDecision === "SHORTLISTED"
                            ? "bg-green-500/20 text-green-300"
                            : session.recruiterDecision === "REJECTED"
                              ? "bg-red-500/20 text-red-300"
                              : session.recruiterDecision === "HOLD"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {session.recruiterDecision}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {session.evaluation ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            session.evaluation.overallScore >= 80 ? "text-green-400" : "text-amber-400"
                          }`}>
                            {session.evaluation.overallScore}
                          </span>
                          <span className="text-slate-500 text-sm">/ 100</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dashboard/${session.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No interviews found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
