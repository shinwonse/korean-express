export interface Station {
  id: string;
  name: string;
  code: string;
}

export const SRT_STATIONS: Station[] = [
  { id: '1', name: '수서', code: 'SSR' },
  { id: '2', name: '동탄', code: 'DTN' },
  { id: '3', name: '평택지제', code: 'PTJ' },
  { id: '4', name: '천안아산', code: 'CAN' },
  { id: '5', name: '오송', code: 'OSG' },
  { id: '6', name: '대전', code: 'DJN' },
  { id: '7', name: '김천(구미)', code: 'KCH' },
  { id: '8', name: '동대구', code: 'DDG' },
  { id: '9', name: '신경주', code: 'SKJ' },
  { id: '10', name: '울산(통도사)', code: 'USN' },
  { id: '11', name: '부산', code: 'BSN' },
];

export const KTX_STATIONS: Station[] = [
  { id: '1', name: '서울', code: 'SEL' },
  { id: '2', name: '용산', code: 'YSN' },
  { id: '3', name: '광명', code: 'GMG' },
  { id: '4', name: '천안아산', code: 'CAN' },
  { id: '5', name: '오송', code: 'OSG' },
  { id: '6', name: '대전', code: 'DJN' },
  { id: '7', name: '김천(구미)', code: 'KCH' },
  { id: '8', name: '동대구', code: 'DDG' },
  { id: '9', name: '신경주', code: 'SKJ' },
  { id: '10', name: '울산', code: 'USN' },
  { id: '11', name: '부산', code: 'BSN' },
];
