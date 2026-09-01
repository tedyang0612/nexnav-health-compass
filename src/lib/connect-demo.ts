export type ConnectFacility = {
  id: number;
  name: string;
  specialty: string;
  distanceKm: number;
  area: string;
  symptoms: string[];
  openToday: boolean;
  mapsName?: string;
  mapsAddress?: string;
};

export const CONNECT_DEMO_FACILITIES: ConnectFacility[] = [
  { id: 1, name: "全O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 0.2, area: "復興北路 73 號", symptoms: ["頭痛", "頭暈", "耳鼻喉"], openToday: true, mapsName: "全煜耳鼻喉科診所", mapsAddress: "台北市松山區復興北路73號2樓" },
  { id: 2, name: "生O物理治療所", specialty: "物理治療", distanceKm: 0.4, area: "復興北路", symptoms: ["腰痠", "肌肉", "關節", "姿勢"], openToday: true },
  { id: 3, name: "心O身心科診所", specialty: "身心科", distanceKm: 0.5, area: "長春路", symptoms: ["疲倦", "精神", "睡眠", "壓力"], openToday: false },
  { id: 4, name: "沛O復健科診所", specialty: "復健科", distanceKm: 0.6, area: "遼寧街", symptoms: ["腰痠", "肌肉", "關節", "疼痛"], openToday: true },
  { id: 5, name: "民O承O診所", specialty: "家庭醫學科", distanceKm: 0.9, area: "民生東路三段 90 號", symptoms: ["頭痛", "頭暈", "疲倦", "腹部"], openToday: true, mapsName: "民生承安診所", mapsAddress: "台北市中山區民生東路三段90號" },
  { id: 6, name: "復O皮膚科診所", specialty: "皮膚科", distanceKm: 1.0, area: "復興南路一段", symptoms: ["皮膚", "過敏"], openToday: false },
  { id: 7, name: "芯O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 1.2, area: "長春路 364 號", symptoms: ["頭痛", "頭暈", "耳鼻喉"], openToday: true, mapsName: "芯慈耳鼻喉科診所", mapsAddress: "台北市中山區長春路364號" },
  { id: 8, name: "鳳O吉O聯合診所", specialty: "家庭醫學科", distanceKm: 1.4, area: "南京東路三段 303 巷 6 弄 9 號", symptoms: ["頭痛", "疲倦", "腹部"], openToday: false, mapsName: "鳳凰吉祥聯合診所", mapsAddress: "台北市松山區南京東路三段303巷6弄9號1樓" },
  { id: 9, name: "台O綜合醫院", specialty: "綜合醫院", distanceKm: 1.6, area: "敦化北路", symptoms: ["頭痛", "頭暈", "腹部", "疼痛"], openToday: true },
  { id: 10, name: "卓O物理治療所", specialty: "物理治療", distanceKm: 1.8, area: "敦化南路一段", symptoms: ["腰痠", "肌肉", "關節", "姿勢"], openToday: false },
  { id: 11, name: "森O肝膽腸胃科診所", specialty: "肝膽腸胃科", distanceKm: 2.0, area: "松江路", symptoms: ["腹部", "腸胃", "噁心"], openToday: true },
  { id: 12, name: "致O醫學診所", specialty: "神經內科", distanceKm: 2.2, area: "中山北路二段 114 號", symptoms: ["頭痛", "頭暈", "麻木"], openToday: true, mapsName: "致好醫學診所", mapsAddress: "台北市中山區中山北路二段114號2樓" },
  { id: 13, name: "親O家庭診所", specialty: "家庭醫學科", distanceKm: 2.5, area: "光復北路", symptoms: ["頭痛", "疲倦", "腹部"], openToday: false },
  { id: 14, name: "領O神經醫學診所", specialty: "神經內科", distanceKm: 2.8, area: "仁愛路四段", symptoms: ["頭痛", "頭暈", "麻木"], openToday: true },
  { id: 15, name: "民O復健診所", specialty: "復健科", distanceKm: 3.1, area: "民權東路三段", symptoms: ["腰痠", "肌肉", "關節", "疼痛"], openToday: false },
  { id: 16, name: "宜O肝膽腸胃科診所", specialty: "肝膽腸胃科", distanceKm: 3.4, area: "信義路四段", symptoms: ["腹部", "腸胃", "噁心"], openToday: true },
  { id: 17, name: "林O家庭醫學專科診所", specialty: "家庭醫學科", distanceKm: 3.7, area: "市民大道三段", symptoms: ["頭痛", "疲倦", "腹部"], openToday: true },
  { id: 18, name: "泰O耳鼻喉科診所", specialty: "耳鼻喉科", distanceKm: 4.0, area: "和平東路二段", symptoms: ["頭痛", "頭暈", "耳鼻喉"], openToday: false },
  { id: 19, name: "一O神經內科診所", specialty: "神經內科", distanceKm: 4.4, area: "中山北路二段", symptoms: ["頭痛", "頭暈", "麻木"], openToday: true },
  { id: 20, name: "康O復健科診所", specialty: "復健科", distanceKm: 4.8, area: "基隆路一段", symptoms: ["腰痠", "肌肉", "關節", "疼痛"], openToday: false },
];

export function connectSearchTarget(symptom: string) {
  if (/腰|肌肉|關節|痠|痛/.test(symptom) && !/頭/.test(symptom)) return "復健科 物理治療";
  if (/腹|腸胃|噁心/.test(symptom)) return "肝膽腸胃科 家庭醫學科";
  if (/疲倦|精神|睡眠|壓力/.test(symptom)) return "身心科 家庭醫學科";
  if (/頭痛|頭暈|麻木/.test(symptom)) return "神經內科 耳鼻喉科 家庭醫學科";
  return "家庭醫學科";
}
