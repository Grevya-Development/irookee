import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Calendar as CalendarIcon, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface BookingModalProps {
  expert: {
    id: string;
    name: string;
    hourly_rate: number;
  };
  trigger?: React.ReactNode;
}

export const BookingModal: React.FC<BookingModalProps> = ({ expert, trigger }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('10:00');
  const [duration, setDuration] = useState<string>('30');

  const handleBooking = () => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for your session.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Booking Submitted",
      description: `Session requested with ${expert.name} on ${format(date, 'PPP')} at ${time}.`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="gradient" className="w-full">Book Session</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900/95 border-slate-800 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Book a Session with {expert.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Date</label>
            <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-none text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Time Slot</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="30">30 mins (${Math.round(expert.hourly_rate / 2)})</SelectItem>
                  <SelectItem value="60">60 mins (${expert.hourly_rate})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={handleBooking} variant="gradient" className="w-full mt-2 shadow-lg shadow-blue-500/20">
          <CreditCard className="w-4 h-4 mr-2" />
          Confirm Booking
        </Button>
      </DialogContent>
    </Dialog>
  );
};
