import React from 'react';
import { Calendar, Clock, Video, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const UserDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Stat Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">Upcoming Sessions</p>
          <p className="text-3xl font-black text-white mt-2">2</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">Completed Sessions</p>
          <p className="text-3xl font-black text-white mt-2">14</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">Total Hours Consulted</p>
          <p className="text-3xl font-black text-white mt-2">8.5 hrs</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Upcoming (2)
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Past Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                alt="Expert"
                className="w-14 h-14 rounded-xl object-cover border border-slate-700"
              />
              <div>
                <h4 className="text-lg font-bold text-white">Sarah Jenkins</h4>
                <p className="text-sm text-slate-400">AI Strategy & Architecture Review</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-400" /> Tomorrow, 10:00 AM</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> 60 mins</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="gradient" className="w-full md:w-auto">
                <Video className="w-4 h-4 mr-2" />
                Join Video Call
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Alex Rivera</h4>
                <p className="text-xs text-slate-400">Completed on Jul 28, 2026</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              View Receipt
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
