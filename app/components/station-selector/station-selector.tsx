import { useState, ChangeEvent } from 'react';
import { Station } from '~/constants/stations';
import { Button } from '~/components/ui/button';
import { ChevronLeft, Search } from 'lucide-react';
import { cn } from '~/lib/cn';
import { Input } from '../ui/input';

interface StationSelectorProps {
  stations: Station[];
  onSelect: (station: Station) => void;
  onBack: () => void;
  title: string;
}

export function StationSelector({
  stations,
  onSelect,
  onBack,
  title,
}: StationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 safe-top safe-bottom">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 -ml-2 h-12 w-12 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </header>

      <div className="sticky top-[57px] z-10 p-4 bg-gray-900 shadow-md">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="역 이름을 입력하세요"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 h-12 text-base bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-900">
        <div className="max-w-lg mx-auto">
          {filteredStations.map((station) => (
            <button
              key={station.id}
              onClick={() => onSelect(station)}
              className={cn(
                'w-full px-4 py-4 text-left text-gray-100',
                'active:bg-gray-800 hover:bg-gray-800/50 transition-colors',
                'border-b border-gray-800 last:border-b-0',
              )}
            >
              <span className="text-base font-medium">{station.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
