import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-bold text-white capitalize",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-zinc-800/50 border border-cyan-500/30 rounded-md p-0 opacity-70 hover:opacity-100 hover:bg-cyan-500/20 transition-all inline-flex items-center justify-center text-cyan-400",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-cyan-400/70 rounded-md w-9 font-bold text-[0.7rem] uppercase",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-cyan-500/20",
          "[&:has([aria-selected])]:bg-cyan-500/20",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "h-9 w-9 p-0 font-medium rounded-md transition-all",
          "hover:bg-cyan-500/30 hover:text-cyan-300",
          "text-zinc-300 aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-cyan-500 text-black font-bold",
          "hover:bg-cyan-400 hover:text-black",
          "focus:bg-cyan-500 focus:text-black"
        ),
        day_today: "bg-zinc-700 text-cyan-400 font-bold border border-cyan-500/50",
        day_outside: cn(
          "day-outside text-zinc-600 opacity-50",
          "aria-selected:bg-cyan-500/30 aria-selected:text-zinc-400 aria-selected:opacity-40"
        ),
        day_disabled: "text-zinc-600 opacity-30",
        day_range_middle: "aria-selected:bg-cyan-500/20 aria-selected:text-cyan-300",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
