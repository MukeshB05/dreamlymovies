import { Metadata } from 'next';
import { InfiniteScrollWrapper } from './infinite-scroll-wrapper';
import { getTVByNetwork, TV_NETWORKS } from '@/lib/tmdb';

interface NetworkPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: NetworkPageProps): Promise<Metadata> {
  const networkId = parseInt(params.id, 10);
  const network = TV_NETWORKS.find((n) => n.id === networkId);
  return {
    title: `${network?.name || 'Network'} TV Shows`,
  };
}

export default async function NetworkPage({ params }: NetworkPageProps) {
  const networkId = parseInt(params.id, 10);
  const network = TV_NETWORKS.find((n) => n.id === networkId);
  const networkName = network?.name || 'Network';
  const initialData = await getTVByNetwork(networkId, 1);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {networkName} TV Shows
        </h1>

        <InfiniteScrollWrapper
          initialItems={initialData.results.map((show) => ({
            ...show,
            media_type: 'tv' as const,
          }))}
          networkId={networkId}
        />
      </div>
    </div>
  );
}
