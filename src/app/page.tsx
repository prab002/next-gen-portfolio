import Image from "next/image";
import { getStats, getTrades } from './actions';
import StatsWidget from '@/components/StatsWidget';
import TradeForm from '@/components/TradeForm';
import TradeList from '@/components/TradeList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getStats();
  const trades = await getTrades();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-lg font-bold mb-4">Performance Overview</h1>
        <StatsWidget stats={stats} />
      </section>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <section>
          <TradeForm />
        </section>

        <section>
          <TradeList trades={trades} />
        </section>
      </div>
    </div>
  );
}
