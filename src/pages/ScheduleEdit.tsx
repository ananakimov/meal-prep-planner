import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { AppShell, ScreenHeader } from "../components/ui";
import { tapMedium } from "../lib/haptics";
import { useStore } from "../state/store";

export default function ScheduleEdit() {
  const { state, setState } = useStore();
  const [schedule, setSchedule] = useState(state.schedule);
  const navigate = useNavigate();
  return (
    <AppShell tabs={false}>
      <ScreenHeader title="Расписание" subtitle="где едите и когда готовите" />
      <section className="px-5 pt-2">
        <div className="rounded-[20px] bg-card p-4 shadow-card">
          <ScheduleGrid value={schedule} onChange={setSchedule} />
        </div>
        <button
          className="btn-primary mt-6 w-full"
          disabled={!schedule.cookDays.length}
          onClick={() => {
            tapMedium();
            setState((s) => ({ ...s, schedule }));
            navigate(-1);
          }}
        >
          Сохранить и пересобрать план
        </button>
      </section>
    </AppShell>
  );
}
