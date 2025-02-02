import { useNavigate, useParams } from '@remix-run/react';
import { useState } from 'react';
import { Station, KTX_STATIONS, SRT_STATIONS } from '~/constants/stations';
import { StationSelector } from '~/components/station-selector/station-selector';

type SelectionType = 'departure' | 'arrival';

export default function StationsRoute() {
  const navigate = useNavigate();
  const { trainType } = useParams();
  const [selectionType, setSelectionType] =
    useState<SelectionType>('departure');
  const [selectedDeparture, setSelectedDeparture] = useState<Station | null>(
    null,
  );

  const stations = trainType === 'ktx' ? KTX_STATIONS : SRT_STATIONS;

  const handleStationSelect = (station: Station) => {
    if (selectionType === 'departure') {
      setSelectedDeparture(station);
      setSelectionType('arrival');
    } else {
      // 출발역과 도착역이 같은 경우 선택 방지
      if (station.id === selectedDeparture?.id) {
        return;
      }
      // 도착역이 선택되면 다음 단계(날짜 선택)로 이동
      navigate(`/booking/${trainType}/date`, {
        state: {
          departure: selectedDeparture,
          arrival: station,
        },
      });
    }
  };

  const handleBack = () => {
    if (selectionType === 'arrival' && selectedDeparture) {
      setSelectionType('departure');
      setSelectedDeparture(null);
    } else {
      navigate(-1);
    }
  };

  // 도착역 선택 시 출발역을 제외한 역 목록 필터링
  const availableStations =
    selectionType === 'arrival'
      ? stations.filter((station) => station.id !== selectedDeparture?.id)
      : stations;

  return (
    <div className="h-screen bg-gray-900">
      <StationSelector
        stations={availableStations}
        onSelect={handleStationSelect}
        onBack={handleBack}
        title={selectionType === 'departure' ? '출발역 선택' : '도착역 선택'}
      />
    </div>
  );
}
