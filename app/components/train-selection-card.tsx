import { cn } from '~/lib/cn';

interface TrainSelectionCardProps {
  type: 'KTX' | 'SRT';
  isSelected: boolean;
  onClick: () => void;
}

export function TrainSelectionCard({
  type,
  isSelected,
  onClick,
}: TrainSelectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all',
        'hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20',
        'bg-gray-800 backdrop-blur-sm',
        isSelected ? 'border-blue-500 bg-blue-900/50' : 'border-gray-700',
      )}
    >
      <img
        src={`/images/${type.toLowerCase()}-logo.svg`}
        alt={`${type} 로고`}
        className={cn('w-24 h-24 sm:w-32 sm:h-32 mb-4')}
      />
      <h2 className={cn('text-xl sm:text-2xl font-bold text-white')}>{type}</h2>
      <p className={cn('mt-2 text-sm text-gray-400')}>
        {type === 'KTX' ? '코레일' : 'SRT'} 열차를 예매합니다
      </p>
    </div>
  );
}
