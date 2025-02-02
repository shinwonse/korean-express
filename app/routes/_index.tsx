import { useState } from 'react';
import type { MetaFunction } from '@remix-run/node';
import { useNavigate } from '@remix-run/react';
import { TrainSelectionCard } from '~/components/train-selection-card';
import { cn } from '~/lib/cn';

export const meta: MetaFunction = () => {
  return [
    { title: 'Korean Express - 기차 예매' },
    { name: 'description', content: 'KTX와 SRT 편리한 기차 예매 서비스' },
  ];
};

export default function Index() {
  const [selectedTrain, setSelectedTrain] = useState<'KTX' | 'SRT' | null>(
    null,
  );
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (!selectedTrain) return;
    const path = `/booking/${selectedTrain.toLowerCase()}/auth`;
    navigate(path);
  };

  return (
    <div className={cn('min-h-screen bg-gray-900 text-gray-100')}>
      <main className={cn('container mx-auto px-4 sm:px-6 lg:px-8 py-16')}>
        <div className={cn('max-w-4xl mx-auto')}>
          <h1
            className={cn(
              'text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-4',
            )}
          >
            어떤 열차를 예매하시겠습니까?
          </h1>
          <p
            className={cn(
              'text-center text-gray-400 mb-12 text-sm sm:text-base',
            )}
          >
            KTX 또는 SRT 중 이용하실 열차를 선택해주세요
          </p>

          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8',
            )}
          >
            <TrainSelectionCard
              type="KTX"
              isSelected={selectedTrain === 'KTX'}
              onClick={() => setSelectedTrain('KTX')}
            />
            <TrainSelectionCard
              type="SRT"
              isSelected={selectedTrain === 'SRT'}
              onClick={() => setSelectedTrain('SRT')}
            />
          </div>

          {selectedTrain && (
            <div className={cn('mt-8 sm:mt-12 text-center')}>
              <button
                onClick={handleNextStep}
                className={cn(
                  'w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg',
                  'hover:bg-blue-700 transition-colors font-medium',
                  'shadow-lg hover:shadow-blue-500/20',
                )}
              >
                다음 단계로
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
