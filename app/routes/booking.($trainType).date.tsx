import { useNavigate, useParams, useLocation } from '@remix-run/react';
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { Button } from '~/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '~/lib/cn';
import type { Station } from '~/constants/stations';
import { SRTService } from '~/services/srt.server';
import { useLoaderData } from '@remix-run/react';
import { getSession } from '~/sessions';

interface LocationState {
  departure: Station;
  arrival: Station;
}

interface AvailableDate {
  date: string;
  isAvailable: boolean;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const sessionId = session.get('sessionId');

  console.log('Session cookie:', request.headers.get('Cookie'));
  console.log('Session data:', session.data);
  console.log('Session ID:', sessionId);

  if (!sessionId) {
    throw new Error('로그인이 필요합니다');
  }

  const srtService = SRTService.getInstance();
  const isAuthenticated = await srtService.isAuthenticated(sessionId);

  if (!isAuthenticated) {
    throw new Error('로그인이 필요합니다');
  }

  const searchParams = new URL(request.url).searchParams;
  const depStationCode = searchParams.get('dep');
  const arrStationCode = searchParams.get('arr');

  if (!depStationCode || !arrStationCode) {
    throw new Error('출발역과 도착역이 필요합니다');
  }

  const today = new Date();
  const availableDates = await srtService.getAvailableDates(
    sessionId,
    depStationCode,
    arrStationCode,
    today,
  );

  return json({ availableDates });
}

export default function DateRoute() {
  const navigate = useNavigate();
  const { trainType } = useParams();
  const location = useLocation();
  const { departure, arrival } = location.state as LocationState;
  const { availableDates } = useLoaderData<typeof loader>();

  const handleDateSelect = (dateStr: string) => {
    navigate(`/booking/${trainType}/time`, {
      state: {
        departure,
        arrival,
        date: dateStr,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateStr: string) => {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[date.getDay()];
    return { month: Number(month), day: Number(day), dayOfWeek };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 -ml-2 h-12 w-12 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-white">출발일 선택</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <span>{departure.name}</span>
              <span>→</span>
              <span>{arrival.name}</span>
            </div>
            {availableDates.map((dateInfo) => {
              const { month, day, dayOfWeek } = formatDate(dateInfo.date);
              const isWeekend = dayOfWeek === '토' || dayOfWeek === '일';
              return (
                <button
                  key={dateInfo.date}
                  onClick={() => handleDateSelect(dateInfo.date)}
                  disabled={!dateInfo.isAvailable}
                  className={cn(
                    'w-full px-4 py-4 text-left rounded-lg',
                    'transition-colors border border-gray-800',
                    dateInfo.isAvailable
                      ? 'hover:bg-gray-800/50 active:bg-gray-800'
                      : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium text-white">
                        {month}월 {day}일
                      </span>
                      <span
                        className={cn(
                          'ml-2 text-sm',
                          isWeekend ? 'text-red-400' : 'text-gray-400',
                        )}
                      >
                        {dayOfWeek}요일
                      </span>
                    </div>
                    {!dateInfo.isAvailable && (
                      <span className="text-sm text-gray-500">예매 불가</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
