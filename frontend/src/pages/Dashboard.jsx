import StatsCard from "../components/StatsCard";
import ResultsChart from "../components/ResultsChart";

import {
  Users,
  Vote,
  ShieldCheck,
  Activity
} from "lucide-react";

export default function Dashboard() {

  return (
    <div>

      <h1 className="text-4xl font-bold mb-8">
        Election Dashboard
      </h1>

      <div className="grid md:grid-cols-4 gap-6">

        <StatsCard
          title="Registered Voters"
          value="1200"
          icon={<Users />}
        />

        <StatsCard
          title="Votes Cast"
          value="860"
          icon={<Vote />}
        />

        <StatsCard
          title="Verified Votes"
          value="845"
          icon={<ShieldCheck />}
        />

        <StatsCard
          title="System Health"
          value="98%"
          icon={<Activity />}
        />

      </div>

    </div>
  );
}
